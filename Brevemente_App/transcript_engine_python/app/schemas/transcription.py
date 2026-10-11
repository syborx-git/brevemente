from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class TranscriptionStatus(str, Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TranscriptSegment(BaseModel):
    """Individual transcribed segment with timing, speaker and confidence."""
    id: int = Field(..., description="Incremental segment index")
    speaker: Optional[str] = Field(None, description="Speaker identifier (e.g. 'SPEAKER_00', 'Terapeuta', 'Paciente')")
    start: float = Field(..., description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    text: str = Field(..., description="Transcribed text fragment")
    confidence: Optional[float] = Field(None, description="Model confidence score between 0.0 and 1.0")


class AsyncTranscriptionInitResponse(BaseModel):
    """Immediate HTTP 202 response acknowledging async processing."""
    task_id: str = Field(..., description="Task unique identifier (UUID)")
    status: TranscriptionStatus = Field(default=TranscriptionStatus.PROCESSING, description="Current status")


class TranscriptionResponse(BaseModel):
    """Structured transcription payload for Spring Boot PostgreSQL JSONB column."""
    task_id: str = Field(..., description="Task unique identifier (UUID)")
    status: TranscriptionStatus = Field(..., description="Final processing status")
    duration_seconds: float = Field(default=0.0, description="Audio total duration in seconds")
    language_detected: Optional[str] = Field(default=None, description="Detected or forced language code (e.g. es, en)")
    full_text: Optional[str] = Field(default=None, description="Full stitched transcription text")
    segments: List[TranscriptSegment] = Field(default_factory=list, description="List of granular segments")
    error_message: Optional[str] = Field(default=None, description="Error detail if status is FAILED")


class ConcurrencyStatus(BaseModel):
    max: int = Field(..., description="Maximum allowed concurrent transcriptions")
    active: int = Field(..., description="Current running transcriptions")
    available: int = Field(..., description="Available slots in semaphore")


class PerformanceSettingsStatus(BaseModel):
    batched_pipeline_enabled: bool = Field(..., description="Whether BatchedInferencePipeline is active")
    batch_size: int = Field(..., description="Batch size for batched inference")
    beam_size: int = Field(..., description="Beam search width")
    cpu_threads: int = Field(..., description="Threads allocated for CPU inference")
    condition_on_previous_text: bool = Field(..., description="Anti-hallucination condition flag")
    vad_min_silence_ms: int = Field(..., description="Minimum silence duration for VAD filter in ms")


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Application health state")
    model_loaded: bool = Field(..., description="Whether faster-whisper model is currently in memory")
    model_name: str = Field(..., description="Whisper model size/name")
    device: str = Field(..., description="Computation device (cpu/cuda)")
    compute_type: str = Field(..., description="Quantization / compute type (int8/float16/float32)")
    concurrency: ConcurrencyStatus = Field(..., description="Real-time semaphore availability")
    performance: PerformanceSettingsStatus = Field(..., description="Active long-audio optimization settings")
