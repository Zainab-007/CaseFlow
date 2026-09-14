"""
Base Speech Service Interface for CaseFlow.
Supports future integration of Whisper, Bhashini (Indian language ASR), or browser Web Speech API.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseSpeechService(ABC):
    """
    Abstract contract for speech-to-text (STT) and text-to-speech (TTS).
    Designed for Indian multilingual clinical environments (Hindi, Hinglish, regional languages).
    """

    @abstractmethod
    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        language_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """Transcribes incoming audio stream/file to text."""
        pass

    @abstractmethod
    async def synthesize_speech(
        self,
        text: str,
        language: str = "en",
        voice_gender: str = "female"
    ) -> bytes:
        """Converts kiosk prompts to audio playback bytes for low-literacy patients."""
        pass


class MockSpeechService(BaseSpeechService):
    """Placeholder mock speech service for foundation phase."""

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        language_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        return {
            "transcript": "Mujhe pichle chaar din se seene me halka dard ho raha hai.",
            "detected_language": "hi",
            "confidence": 0.94
        }

    async def synthesize_speech(
        self,
        text: str,
        language: str = "en",
        voice_gender: str = "female"
    ) -> bytes:
        return b"MOCK_AUDIO_BYTES"
