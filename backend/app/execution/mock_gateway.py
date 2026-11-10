import time
import uuid
import random
from typing import Dict, Any, Optional
from app.execution.base_adapter import BaseSMSAdapter, DeliveryResult

class MockSMSGateway(BaseSMSAdapter):
    """
    Mock SMS Gateway: Simulates realistic virtual cellular carrier routing,
    network handshake latency, and delivery receipts without touching real telco networks.
    """
    def send(self, recipient_phone: str, content: str, options: Optional[Dict[str, Any]] = None) -> DeliveryResult:
        start_time = time.time()
        # Simulate radio link & SMSC latency (10-80ms)
        simulated_delay = random.uniform(0.015, 0.080)
        time.sleep(simulated_delay)

        latency_ms = round((time.time() - start_time) * 1000.0, 2)
        message_id = f"MOCK-SMSC-{uuid.uuid4().hex[:12].upper()}"

        return DeliveryResult(
            success=True,
            provider_message_id=message_id,
            status="SIMULATED_DELIVERED",
            provider_name="MockCarrierGateway",
            is_simulated=True,
            latency_ms=latency_ms,
            cost_usd=0.0,
            error_message=None
        )

mock_gateway = MockSMSGateway()
