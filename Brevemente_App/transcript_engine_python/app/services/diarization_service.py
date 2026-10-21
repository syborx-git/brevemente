import logging
from typing import List, Optional, Tuple

logger = logging.getLogger("transcription_engine.diarization_service")

try:
    import torch
    from pyannote.audio import Pipeline as PyAnnotePipeline
    _HAS_PYANNOTE = True
except (ImportError, Exception):
    _HAS_PYANNOTE = False


class DiarizationService:
    """
    Modular Acoustic Diarization Service:
    - If pyannote.audio and HF_TOKEN are present: Uses PyAnnote speaker-diarization-3.1
      to extract acoustic voice embeddings and identify speakers by timbre.
    - Fallback: Uses conversational turn-taking boundaries (temporal silence gaps,
      question closures, and dialogue pacing) to assign distinct interlocutor tags
      (SPEAKER_00 / SPEAKER_01).
    """

    def __init__(self, settings):
        self.settings = settings
        self._pipeline = None
        self._initialized = False

    def is_enabled(self) -> bool:
        return getattr(self.settings, "ENABLE_ACOUSTIC_DIARIZATION", True)

    def get_engine_name(self) -> str:
        if not self.is_enabled():
            return "disabled (semantic classification in Spring Boot)"
        if _HAS_PYANNOTE and getattr(self.settings, "HF_TOKEN", None):
            return "pyannote.audio (speaker-diarization-3.1)"
        return "conversational-turn acoustic heuristic"

    def initialize(self) -> None:
        if not self.is_enabled():
            logger.info("Acoustic diarization is disabled via settings.")
            return

        if _HAS_PYANNOTE and getattr(self.settings, "HF_TOKEN", None):
            try:
                logger.info("Initializing PyAnnote speaker diarization pipeline...")
                self._pipeline = PyAnnotePipeline.from_pretrained(
                    "pyannote/speaker-diarization-3.1",
                    use_auth_token=self.settings.HF_TOKEN,
                )
                device = getattr(self.settings, "WHISPER_DEVICE", "cpu")
                if device == "cuda" and torch.cuda.is_available():
                    self._pipeline.to(torch.device("cuda"))
                logger.info("PyAnnote pipeline successfully loaded.")
            except Exception as e:
                logger.warning(
                    f"Could not initialize PyAnnote pipeline ({e}). "
                    "Using conversational turn acoustic heuristic."
                )
                self._pipeline = None
        else:
            logger.info(
                "PyAnnote/HF_TOKEN not configured. "
                "Active diarization engine: conversational-turn acoustic heuristic."
            )

    def diarize_segments(self, audio_path: str, segments: list) -> list:
        if not segments:
            return segments

        # 1. If PyAnnote is active, perform biometric acoustic alignment
        if self._pipeline is not None:
            try:
                return self._diarize_with_pyannote(audio_path, segments)
            except Exception as err:
                logger.error(f"PyAnnote diarization failed ({err}). Falling back to turn heuristic.")

        # 2. Heuristic fallback based on temporal turn-taking and conversational boundaries
        return self._diarize_conversational_heuristic(segments)

    def _diarize_with_pyannote(self, audio_path: str, segments: list) -> list:
        min_spk = getattr(self.settings, "DIARIZATION_MIN_SPEAKERS", 2)
        max_spk = getattr(self.settings, "DIARIZATION_MAX_SPEAKERS", 2)
        diarization = self._pipeline(audio_path, min_speakers=min_spk, max_speakers=max_spk)

        # Collect pyannote speaker intervals: [(start, end, speaker)]
        speaker_intervals: List[Tuple[float, float, str]] = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            speaker_intervals.append((turn.start, turn.end, speaker))

        # Assign speaker to each whisper segment based on maximum temporal overlap
        for seg in segments:
            seg_start, seg_end = seg.start, seg.end
            best_speaker = None
            max_overlap = 0.0

            for spk_start, spk_end, spk in speaker_intervals:
                overlap = max(0.0, min(seg_end, spk_end) - max(seg_start, spk_start))
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_speaker = spk

            if best_speaker:
                seg.speaker = best_speaker

        return segments

    def _diarize_conversational_heuristic(self, segments: list) -> list:
        """
        Alternates between SPEAKER_00 and SPEAKER_01 based on temporal silence pauses
        (>0.85s) and conversational punctuation cues (questions, dialog closures).
        """
        current_speaker = "SPEAKER_00"
        prev_end = 0.0

        for seg in segments:
            silence_gap = seg.start - prev_end
            text = (seg.text or "").strip()

            # Significant pause or question boundary marks turn alternation
            if prev_end > 0.0 and (silence_gap > 0.85 or text.endswith("?") or text.endswith("¿")):
                current_speaker = "SPEAKER_01" if current_speaker == "SPEAKER_00" else "SPEAKER_00"

            seg.speaker = current_speaker
            prev_end = seg.end

        return segments
