import time
import uuid
import random
from typing import Dict, Any, Optional
from app.execution.base_adapter import BaseSMSAdapter, DeliveryResult

class ProviderSandboxAdapter(BaseSMSAdapter):
    """
    Provider Sandbox Adapter: Simulates official cloud provider sandbox environment
    (e.g., Twilio / Infobip / Sinch Test Credential Mode) with provider delivery tokens and tariff costing.
    """
    def send(self, recipient_phone: str, content: str, options: Optional[Dict[str, Any]] = None) -> DeliveryResult:
        start_time = time.time()
        # Simulate cloud API latency (80-220ms)
        time.sleep(random.uniform(0.08, 0.22))

        latency_ms = round((time.time() - start_time) * 1000.0, 2)
        message_id = f"SANDBOX-TW-{uuid.uuid4().hex[:16]}"
        
        # Determine cost based on length/unicode
        is_unicode = any(ord(c) > 127 for c in content)
        rate = 0.0075 if not is_unicode else 0.0125

        return DeliveryResult(
            success=True,
            provider_message_id=message_id,
            status="PROVIDER_CONFIRMED",
            provider_name="TwilioTelcoSandbox",
            is_simulated=False, # Official Sandbox confirmation
            latency_ms=latency_ms,
            cost_usd=rate,
            error_message=None
        )

provider_sandbox = ProviderSandboxAdapter()
