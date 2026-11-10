import random
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models import TestSession, Message
from app.protection.protection_manager import protection_manager

SCENARIO_TEMPLATES = {
    "normal": [
        ("Hey Alex, let's grab coffee around 2:30 PM today.", "+12025550111"),
        ("Your GitHub 2FA authentication code is 492104. Never share it.", "+18005550100"),
        ("Uber: Your ride with driver Dave (Toyota Prius) is 2 mins away.", "+14155550123"),
        ("Dr. Evans Clinic: Appointment reminder for tomorrow at 10:15 AM. Reply C to confirm.", "+12125550199"),
        ("Delta Air: Flight DL-402 is boarding at Gate B18. Have your boarding pass ready.", "+18005550188"),
        ("Your CVS prescription #49120 is ready for contactless pickup.", "+13125550144"),
        ("Home Depot order #94218 is ready for locker pickup. Locker PIN: 8391.", "+14155550155")
    ],
    "bank_phishing": [
        ("URGENT: Chase Fraud Alert. A suspicious charge of $1,250.00 was attempted at Best Buy. If unauthorized, verify here: http://chase-security-verify.xyz", "+18884920192"),
        ("Wells Fargo Notice: Your debit card is temporarily suspended due to security risk. Reactivate access immediately: http://bit.ly/wf-lock-restore", "+18775550143"),
        ("Bank of America: We detected an unrecognized device sign-in. Confirm identity to avoid closure: http://bofa-login-portal.click", "+18005550132"),
        ("Citibank: Wire transfer of $3,400.00 submitted. Dispute charge within 30 mins: http://citi-wire-cancel.top", "+18885550176"),
        ("PayPal Alert: You sent $840.00 to CryptoPay. Cancel transfer if not you: http://paypal-dispute-center.xyz", "+18775550188")
    ],
    "delivery_scam": [
        ("USPS: Package 9400100000000000000000 is detained at sorting hub due to incorrect street number. Resolve address: http://bit.ly/usps-package-resolve", "+12025550189"),
        ("FedEx Express: Courier attempted delivery of parcel FX-98214. Reschedule delivery and pay $1.99 redelivery fee at http://fedex-redelivery.xyz", "+14155550167"),
        ("UPS Notification: Custom fee unpaid on incoming international package. Pay balance to clear dispatch: http://ups-customs-clearance.top", "+13125550198"),
        ("DHL Express: Your shipment is on hold. Complete delivery information within 24h: http://dhl-shipment-confirm.click", "+12125550165")
    ],
    "urgent_wire": [
        ("EMERGENCY: Your grandson was involved in an accident and needs immediate $2,500 bail wire via Western Union. Call 1-800-555-0199 now.", "+12025550177"),
        ("IRS Notice: Final legal notice regarding unpaid federal tax penalty of $4,850. Pay via Crypto transfer to avoid warrant: http://irs-tax-settle.xyz", "+18005550166"),
        ("Congratulations! You won $250,000 in the National Cash Sweepstakes. Wire $150 processing fee to claim prize: http://instant-cash-reward.cam", "+18885550122")
    ],
    "bulk_burst": [
        ("LOAN APPROVED! You are pre-approved for an instant $10,000 cash advance today! No credit check! Claim here: http://fast-cash-approval.loan", "+18005559999"),
        ("LOAN APPROVED! You are pre-approved for an instant $10,000 cash advance today! No credit check! Claim here: http://fast-cash-approval.loan", "+18005559999"),
        ("LOAN APPROVED! You are pre-approved for an instant $10,000 cash advance today! No credit check! Claim here: http://fast-cash-approval.loan", "+18005559999"),
        ("LOAN APPROVED! You are pre-approved for an instant $10,000 cash advance today! No credit check! Claim here: http://fast-cash-approval.loan", "+18005559999")
    ]
}

class SimulationEngine:
    """SMS Testing Lab Execution Engine"""

    def generate_message_sample(self, scenario: str) -> Tuple[str, str]:
        """Returns (content, sender_phone) based on selected scenario."""
        if scenario == "mixed":
            all_scenarios = ["normal", "bank_phishing", "delivery_scam", "urgent_wire", "bulk_burst"]
            chosen_scenario = random.choice(all_scenarios)
            samples = SCENARIO_TEMPLATES[chosen_scenario]
        elif scenario in SCENARIO_TEMPLATES:
            samples = SCENARIO_TEMPLATES[scenario]
        else:
            samples = SCENARIO_TEMPLATES["normal"]

        return random.choice(samples)

    def run_simulation(
        self,
        db: Session,
        name: str,
        scenario: str,
        count: int,
        frequency_per_sec: float = 2.0
    ) -> TestSession:
        """Executes a simulated batch test session locally and streams analysis into database."""
        session = TestSession(
            name=name,
            scenario=scenario,
            message_count=count,
            frequency_per_sec=frequency_per_sec,
            status="running",
            total_processed=0,
            total_spam=0,
            total_phishing=0,
            total_blocked=0,
            avg_latency_ms=0.0
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        latencies: List[float] = []
        delay = max(0.01, 1.0 / frequency_per_sec) if frequency_per_sec > 0 else 0.05

        try:
            for i in range(count):
                content, sender = self.generate_message_sample(scenario)
                t_start = time.time()

                # Process through multi-layer defense engine
                processed_msg = protection_manager.process_and_analyze_message(
                    db=db,
                    sender_phone=sender,
                    content=content,
                    recipient="+10000000000",
                    session_id=session.id
                )

                latency_ms = (time.time() - t_start) * 1000.0
                latencies.append(latency_ms)

                session.total_processed += 1
                if processed_msg.risk_score >= 80.0:
                    session.total_phishing += 1
                if processed_msg.risk_score >= 60.0:
                    session.total_spam += 1
                if processed_msg.status == "blocked":
                    session.total_blocked += 1

                # Small throttled simulation delay if fast batch
                if i < count - 1 and delay < 0.2:
                    time.sleep(delay)

            session.status = "completed"
            session.completed_at = datetime.now(timezone.utc)
            session.avg_latency_ms = round(sum(latencies) / max(len(latencies), 1), 2)
            db.commit()
            db.refresh(session)
        except Exception as e:
            session.status = "failed"
            db.commit()
            raise e

        return session

simulation_engine = SimulationEngine()
