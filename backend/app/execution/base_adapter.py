from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel

class DeliveryResult(BaseModel):
    success: bool
    provider_message_id: str
    status: str  # SIMULATED_DELIVERED, PROVIDER_CONFIRMED, FAILED
    provider_name: str
    is_simulated: bool
    latency_ms: float
    cost_usd: float
    error_message: Optional[str] = None

class BaseSMSAdapter(ABC):
    @abstractmethod
    def send(self, recipient_phone: str, content: str, options: Optional[Dict[str, Any]] = None) -> DeliveryResult:
        """Dispatches an SMS payload to the specified adapter."""
        pass
