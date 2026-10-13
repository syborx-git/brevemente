import asyncio
import logging
import math
import os
import time
from typing import List, Optional, Tuple

import httpx
from faster_whisper import WhisperModel

try:
    from faster_whisper import BatchedInferencePipeline
    _HAS_BATCHED_PIPELINE = True
except ImportError:
    _HAS_BATCHED_PIPELINE = False

from app.config import Settings
from app.schemas.transcription import (
    TranscriptSegment,
    TranscriptionResponse,
    TranscriptionStatus,
    ConcurrencyStatus,
    PerformanceSettingsStatus,
)
from app.services.diarization_service import DiarizationService


logger = logging.getLogger("transcription_engine.whisper_service")


class WhisperService:
    """
    Core transcription service managing faster-whisper model lifecycle,
    bounded concurrency via asyncio.Semaphore, BatchedInferencePipeline for
    long audio sessions, and non-blocking execution in worker thread pools.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self._model: Optional[WhisperModel] = None
        self._batched_pipeline = None
        self._semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_TRANSCRIPTIONS)
        self._active_tasks = 0
        self._lock = asyncio.Lock()
        self.diarization_service = DiarizationService(settings)

    def is_loaded(self) -> bool:
        return self._model is not None

    def get_performance_status(self) -> PerformanceSettingsStatus:
        """Returns the active optimization parameters for long audios."""
        return PerformanceSettingsStatus(
            batched_pipeline_enabled=(self._batched_pipeline is not None),
            batch_size=self.settings.WHISPER_BATCH_SIZE,
            beam_size=self.settings.WHISPER_BEAM_SIZE,
            cpu_threads=self.settings.WHISPER_CPU_THREADS,
            condition_on_previous_text=self.settings.WHISPER_CONDITION_ON_PREVIOUS_TEXT,
            vad_min_silence_ms=self.settings.WHISPER_VAD_MIN_SILENCE_DURATION_MS,
            diarization_engine=self.diarization_service.get_engine_name(),
        )

    async def load_model(self) -> None:
        """
        Loads the faster-whisper model and initializes BatchedInferencePipeline
        once during application startup inside asyncio.to_thread.
        """
        self.diarization_service.initialize()

        logger.info(
            f"Pre-loading Whisper model: size='{self.settings.WHISPER_MODEL_SIZE}', "
            f"device='{self.settings.WHISPER_DEVICE}', compute_type='{self.settings.WHISPER_COMPUTE_TYPE}', "
            f"cpu_threads={self.settings.WHISPER_CPU_THREADS}"
        )
        start_time = time.time()

        def _init_model() -> Tuple[WhisperModel, Optional[object]]:
            model = WhisperModel(
                model_size_or_path=self.settings.WHISPER_MODEL_SIZE,
                device=self.settings.WHISPER_DEVICE,
                compute_type=self.settings.WHISPER_COMPUTE_TYPE,
                cpu_threads=self.settings.WHISPER_CPU_THREADS,
                num_workers=self.settings.WHISPER_NUM_WORKERS,
                download_root=self.settings.WHISPER_DOWNLOAD_ROOT,
            )

            pipeline = None
            if _HAS_BATCHED_PIPELINE and self.settings.WHISPER_USE_BATCHED:
                try:
                    pipeline = BatchedInferencePipeline(model=model)
                    logger.info("BatchedInferencePipeline enabled successfully.")
                except Exception as b_err:
                    logger.warning(f"Could not initialize BatchedInferencePipeline: {b_err}. Falling back to standard pipeline.")
                    pipeline = None

            return model, pipeline

        self._model, self._batched_pipeline = await asyncio.to_thread(_init_model)
        elapsed = time.time() - start_time
        logger.info(f"Whisper model initialized in {elapsed:.2f} seconds.")

    async def switch_model(self, model_name: str, compute_type: Optional[str] = None) -> dict:
        """
        Dynamically unloads current Whisper model and loads the requested model into memory.
        """
        async with self._lock:
            old_name = self.settings.WHISPER_MODEL_SIZE
            old_compute = self.settings.WHISPER_COMPUTE_TYPE
            target_compute = compute_type or old_compute

            logger.info(
                f"[Whisper Model Switch] Cambiando modelo de '{old_name}' a '{model_name}' "
                f"(compute_type='{target_compute}')..."
            )
            old_model = self._model
            old_pipeline = self._batched_pipeline

            self.settings.WHISPER_MODEL_SIZE = model_name
            self.settings.WHISPER_COMPUTE_TYPE = target_compute

            try:
                await self.load_model()
                del old_model
                del old_pipeline
                logger.info(f"[Whisper Model Switch] Modelo '{model_name}' activado con éxito en RAM.")
                return {
                    "status": "success",
                    "previous_model": old_name,
                    "active_model": self.settings.WHISPER_MODEL_SIZE,
                    "compute_type": self.settings.WHISPER_COMPUTE_TYPE,
                    "device": self.settings.WHISPER_DEVICE,
                }
            except Exception as exc:
                logger.error(f"[Whisper Model Switch] Error al cargar modelo '{model_name}': {exc}. Restaurando previo '{old_name}'.")
                self.settings.WHISPER_MODEL_SIZE = old_name
                self.settings.WHISPER_COMPUTE_TYPE = old_compute
                self._model = old_model
                self._batched_pipeline = old_pipeline
                raise exc

    async def get_concurrency_status(self) -> ConcurrencyStatus:
        """Returns the real-time concurrency status."""
        async with self._lock:
            active = self._active_tasks
            max_tasks = self.settings.MAX_CONCURRENT_TRANSCRIPTIONS
            available = max(0, max_tasks - active)
            return ConcurrencyStatus(max=max_tasks, active=active, available=available)

    def _sync_transcribe(
        self, audio_path: str, language: Optional[str]
    ) -> Tuple[str, List[TranscriptSegment], float, Optional[str]]:
        """
        Synchronous worker method executing faster-whisper CTranslate2 pipeline.
        Optimized with BatchedInferencePipeline, reduced beam size, VAD filtering,
        and anti-hallucination controls for long audio files (30-60 min).
        """
        if self._model is None:
            raise RuntimeError("Whisper model is not initialized.")

        target_lang = language if (language and language.lower() != "auto") else None
        vad_params = dict(min_silence_duration_ms=self.settings.WHISPER_VAD_MIN_SILENCE_DURATION_MS)
        # LEVA: contexto clínico para sesgar el vocabulario (None si está vacío)
        initial_prompt = (self.settings.WHISPER_INITIAL_PROMPT or "").strip() or None

        # Execute via Batched pipeline if available, otherwise standard transcribe
        if self._batched_pipeline is not None:
            logger.debug(f"Transcribing via BatchedInferencePipeline (batch_size={self.settings.WHISPER_BATCH_SIZE})...")
            segments_generator, info = self._batched_pipeline.transcribe(
                audio_path,
                batch_size=self.settings.WHISPER_BATCH_SIZE,
                language=target_lang,
                beam_size=self.settings.WHISPER_BEAM_SIZE,
                vad_filter=True,
                vad_parameters=vad_params,
                initial_prompt=initial_prompt,
            )
        else:
            logger.debug(f"Transcribing via standard WhisperModel (beam_size={self.settings.WHISPER_BEAM_SIZE})...")
            segments_generator, info = self._model.transcribe(
                audio_path,
                language=target_lang,
                beam_size=self.settings.WHISPER_BEAM_SIZE,
                condition_on_previous_text=self.settings.WHISPER_CONDITION_ON_PREVIOUS_TEXT,
                vad_filter=True,
                vad_parameters=vad_params,
                initial_prompt=initial_prompt,
            )

        segments: List[TranscriptSegment] = []
        text_parts: List[str] = []

        # Materialize generator inside the worker thread
        for idx, segment in enumerate(segments_generator):
            # Calculate normalized confidence score
            conf: Optional[float] = None
            if segment.avg_logprob is not None:
                try:
                    conf = round(min(max(math.exp(segment.avg_logprob), 0.0), 1.0), 2)
                except OverflowError:
                    conf = 1.0

            clean_text = segment.text.strip()
            if clean_text:
                text_parts.append(clean_text)

            segments.append(
                TranscriptSegment(
                    id=idx,
                    speaker=getattr(segment, "speaker", None),
                    start=round(segment.start, 2),
                    end=round(segment.end, 2),
                    text=segment.text,
                    confidence=conf,
                )
            )

        full_text = " ".join(text_parts).strip()
        duration_seconds = round(info.duration, 2) if info.duration else 0.0
        detected_language = info.language

        # Acoustic Speaker Diarization
        if self.diarization_service.is_enabled():
            try:
                segments = self.diarization_service.diarize_segments(audio_path, segments)
            except Exception as d_err:
                logger.warning(f"Acoustic diarization encountered an issue: {d_err}. Keeping standard segments.")

        return full_text, segments, duration_seconds, detected_language

    async def execute_transcription(
        self,
        task_id: str,
        audio_path: str,
        language: Optional[str] = "es",
    ) -> TranscriptionResponse:
        """
        Acquires semaphore and executes transcription in worker thread,
        ensuring guaranteed resource release in finally block.
        """
        logger.info(f"[Task {task_id}] Waiting for semaphore slot (Max: {self.settings.MAX_CONCURRENT_TRANSCRIPTIONS})...")

        async with self._semaphore:
            async with self._lock:
                self._active_tasks += 1

            logger.info(f"[Task {task_id}] Acquired slot. Running transcription on '{audio_path}' (Active: {self._active_tasks})...")
            start_time = time.time()

            try:
                full_text, segments, duration, detected_lang = await asyncio.to_thread(
                    self._sync_transcribe, audio_path, language
                )
                elapsed = time.time() - start_time
                logger.info(f"[Task {task_id}] Transcription completed successfully in {elapsed:.2f}s (Audio duration: {duration}s).")

                return TranscriptionResponse(
                    task_id=task_id,
                    status=TranscriptionStatus.COMPLETED,
                    duration_seconds=duration,
                    language_detected=detected_lang,
                    full_text=full_text,
                    segments=segments,
                    error_message=None,
                )

            except Exception as exc:
                elapsed = time.time() - start_time
                logger.exception(f"[Task {task_id}] Transcription failed after {elapsed:.2f}s: {exc}")
                return TranscriptionResponse(
                    task_id=task_id,
                    status=TranscriptionStatus.FAILED,
                    duration_seconds=0.0,
                    language_detected=None,
                    full_text=None,
                    segments=[],
                    error_message=str(exc),
                )

            finally:
                async with self._lock:
                    self._active_tasks = max(0, self._active_tasks - 1)
                logger.info(f"[Task {task_id}] Semaphore slot released (Remaining active: {self._active_tasks}).")

    async def process_async_task(
        self,
        task_id: str,
        audio_path: str,
        is_temp_file: bool,
        callback_url: Optional[str] = None,
        language: Optional[str] = "es",
    ) -> None:
        """
        Background task orchestrator: executes transcription, sends webhook if callback_url
        is provided, and cleans up local temporary files.
        """
        try:
            result = await self.execute_transcription(
                task_id=task_id,
                audio_path=audio_path,
                language=language,
            )

            if callback_url:
                await self._send_callback(callback_url, result)

        finally:
            if is_temp_file and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                    logger.debug(f"[Task {task_id}] Cleaned up temp file: {audio_path}")
                except OSError as cleanup_err:
                    logger.warning(f"[Task {task_id}] Failed to remove temp audio file '{audio_path}': {cleanup_err}")

    async def _send_callback(self, callback_url: str, response: TranscriptionResponse) -> None:
        """
        Sends the final JSONB-compatible payload to Spring Boot backend via HTTP POST.
        """
        logger.info(f"[Task {response.task_id}] Sending callback to {callback_url}...")
        headers = {
            "Content-Type": "application/json",
            "X-Internal-API-Key": self.settings.INTERNAL_API_KEY,
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.CALLBACK_TIMEOUT_SECONDS) as client:
                res = await client.post(
                    callback_url,
                    json=response.model_dump(),
                    headers=headers,
                )
                if res.is_success:
                    logger.info(f"[Task {response.task_id}] Callback delivered successfully (HTTP {res.status_code}).")
                else:
                    logger.error(
                        f"[Task {response.task_id}] Callback returned non-2xx status: "
                        f"{res.status_code} - Body: {res.text[:300]}"
                    )
        except Exception as err:
            logger.error(f"[Task {response.task_id}] Failed to deliver callback to {callback_url}: {err}")
