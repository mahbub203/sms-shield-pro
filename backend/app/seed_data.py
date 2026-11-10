import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models import (
    User, Sender, Message, DetectionResult, BlockedSender, AllowedSender,
    SecurityEvent, SystemSetting, Recipient, ConsentRecord, MessageTemplate,
    AutomationJob, DeliveryEvent
)
from app.auth import hash_password
from app.config import settings
from app.statistical.stats_analyzer import compute_hash
from app.utils.sms_counter import calculate_sms_segments

HISTORICAL_MESSAGES = [
    # Phishing
    ("URGENT: Chase Fraud Alert. A suspicious charge of $1,250.00 was attempted at Best Buy. If unauthorized, verify here: http://chase-security-verify.xyz", "+18884920192", 94.5, "PHISHING_THREAT", "blocked", ["Phishing urgency marker: 'fraud alert'", "Suspicious / Shortened URL detected", "ML key suspicious tokens: chase, fraud, charge"]),
    ("Wells Fargo Notice: Your debit card is temporarily suspended due to security risk. Reactivate access immediately: http://bit.ly/wf-lock-restore", "+18775550143", 92.0, "PHISHING_THREAT", "blocked", ["Phishing urgency marker: 'suspended'", "Suspicious / Shortened URL detected", "Brand impersonation"]),
    ("USPS: Package 9400100000000000000000 is detained at sorting hub due to incorrect street number. Resolve address: http://bit.ly/usps-package-resolve", "+12025550189", 88.0, "PHISHING_THREAT", "blocked", ["Impersonation of parcel courier", "Suspicious / Shortened URL detected"]),
    ("Citibank: Wire transfer of $3,400.00 submitted. Dispute charge within 30 mins: http://citi-wire-cancel.top", "+18885550176", 91.5, "PHISHING_THREAT", "blocked", ["Urgent payment solicitation", "Suspicious TLD: .top", "Brand impersonation"]),
    ("PayPal Alert: You sent $840.00 to CryptoPay. Cancel transfer if not you: http://paypal-dispute-center.xyz", "+18775550188", 86.0, "PHISHING_THREAT", "blocked", ["Urgent payment solicitation", "Suspicious URL: .xyz"]),
    ("FedEx Express: Courier attempted delivery of parcel FX-98214. Reschedule delivery and pay $1.99 redelivery fee at http://fedex-redelivery.xyz", "+14155550167", 89.0, "PHISHING_THREAT", "blocked", ["Parcel delivery scam", "Suspicious URL"]),
    ("IRS Notice: Final legal notice regarding unpaid federal tax penalty of $4,850. Pay via Crypto transfer: http://irs-tax-settle.xyz", "+18005550166", 96.0, "PHISHING_THREAT", "blocked", ["Impersonation of government agency", "Crypto payment request", "Urgency pressure"]),
    
    # Suspicious / Quarantined
    ("LOAN APPROVED! You are pre-approved for an instant $10,000 cash advance today! Claim here: http://fast-cash-approval.loan", "+18005559999", 74.0, "HIGH_RISK", "quarantined", ["High numeric character density", "Urgent payment solicitation"]),
    ("WINNER: You won 2nd prize in the National Lottery Draw! Call +18005550199 or visit http://lottery-claim.org", "+12025550144", 68.5, "HIGH_RISK", "quarantined", ["Financial reward solicitation", "Excessive exclamations"]),
    ("Work from home and earn $600 daily! Only smartphone required. Register at http://quick-cash-daily.click", "+14155550129", 71.0, "HIGH_RISK", "quarantined", ["Unsolicited income solicitation", "Suspicious TLD: .click"]),
    ("Your car warranty has expired! Final warning before policy cancellation. Call 1-888-555-0144 now.", "+18885550144", 64.0, "SUSPICIOUS", "allowed", ["Urgency pressure", "Excessive exclamations"]),
    ("FINAL CHANCE: 50% discount on all wellness supplements ending midnight! Visit our web store.", "+12125550172", 42.0, "SUSPICIOUS", "allowed", ["Marketing promotion", "Excessive uppercase shouting"]),

    # Normal / Safe
    ("Hey Alex, let's grab coffee around 2:30 PM today.", "+12025550111", 4.0, "SAFE", "allowed", []),
    ("Your GitHub 2FA authentication code is 492104. Never share it.", "+18005550100", 6.5, "SAFE", "allowed", ["Verified allowlist sender"]),
    ("Uber: Your ride with driver Dave (Toyota Prius) is 2 mins away.", "+14155550123", 8.0, "SAFE", "allowed", []),
    ("Dr. Evans Clinic: Appointment reminder for tomorrow at 10:15 AM. Reply C to confirm.", "+12125550199", 5.0, "SAFE", "allowed", []),
    ("Delta Air: Flight DL-402 is boarding at Gate B18. Have your boarding pass ready.", "+18005550188", 7.0, "SAFE", "allowed", ["Verified allowlist sender"]),
    ("Your CVS prescription #49120 is ready for contactless pickup.", "+13125550144", 6.0, "SAFE", "allowed", []),
    ("Home Depot order #94218 is ready for locker pickup. Locker PIN: 8391.", "+14155550155", 9.0, "SAFE", "allowed", []),
    ("Can you please review the updated quarterly architecture diagram when you get back to your desk?", "+12025550115", 3.0, "SAFE", "allowed", []),
    ("Hey mom, I arrived safely at the hotel in Austin! Love you, will call later tonight.", "+15125550182", 2.0, "SAFE", "allowed", []),
    ("Target: Your drive-up order is ready! Pull into a parking bay and notify us in the mobile app.", "+18005550165", 8.5, "SAFE", "allowed", []),
    ("Your haircut appointment with Rachel is confirmed for Saturday at 11:30 AM.", "+14155550190", 5.5, "SAFE", "allowed", []),
    ("Hi David, the team retrospective meeting is moved to Room 4B at 3:00 PM.", "+12025550171", 3.5, "SAFE", "allowed", [])
]

DEFAULT_TEMPLATES = [
    {
        "name": "2FA Security OTP (English)",
        "content": "Your SMS Shield verification security code is 749201. Valid for 10 minutes. Never share this code.",
        "category": "OTP"
    },
    {
        "name": "Bengali 2FA Verification (বাংলা)",
        "content": "আপনার এসএমএস শিল্ড ওটিপি (OTP) কোড হল ৭৪৯২০১। নিরাপত্তা নিশ্চিত করতে এই কোড কাউকে জানাবেন না।",
        "category": "BENGALI_NOTICE"
    },
    {
        "name": "Security Incident Alert",
        "content": "SECURITY ALERT: Unrecognized login attempt detected. Reply STOP to halt your active sessions immediately.",
        "category": "SECURITY_ALERT"
    },
    {
        "name": "Bengali Security Warning (বাংলা সতর্কবার্তা)",
        "content": "সতর্কতা: আপনার একাউন্টে অস্বাভাবিক কার্যকলাপ সনাক্ত করা হয়েছে। অবিলম্বে নিরাপত্তা পোর্টাল যাচাই করুন।",
        "category": "BENGALI_NOTICE"
    },
    {
        "name": "Transaction Confirmation Notice",
        "content": "SMS Shield: Transaction #TXN-98421 of $45.00 has been successfully processed for your account.",
        "category": "TRANSACTIONAL"
    }
]

def seed_database(db: Session):
    now = datetime.now(timezone.utc)

    # 1. Admin & Analyst Users
    admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin_user:
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            full_name=settings.ADMIN_NAME,
            role="admin",
            is_active=True
        )
        db.add(admin_user)

    analyst_user = db.query(User).filter(User.email == "analyst@smsshield.io").first()
    if not analyst_user:
        analyst_user = User(
            email="analyst@smsshield.io",
            hashed_password=hash_password("Analyst@Shield2026!"),
            full_name="Threat Analyst",
            role="analyst",
            is_active=True
        )
        db.add(analyst_user)

    # 2. System Settings
    default_settings = [
        ("emergency_lockdown_mode", "false", "When active, strictly blocks or quarantines messages from unknown senders"),
        ("risk_suspicious_threshold", "40.0", "Threshold at which an SMS is flagged as suspicious"),
        ("risk_high_threshold", "75.0", "Threshold at which an SMS is quarantined or blocked"),
        ("rate_limit_per_minute", "5", "Maximum SMS rate allowed per sender phone number per minute"),
        ("auto_block_critical", "true", "Automatically add sender to blocklist if critical phishing detected"),
        ("duplicate_time_window_mins", "10", "Window to check duplicate broadcast SMS floods")
    ]
    for key, val, desc in default_settings:
        if not db.query(SystemSetting).filter(SystemSetting.key == key).first():
            db.add(SystemSetting(key=key, value=val, description=desc))

    # 3. Blocked Senders
    default_blocked = [
        ("+18005559999", "Automated high-velocity loan spam broadcast bot", "SecOps Automated"),
        ("+18884920192", "Targeted Chase Bank credential phishing vector", "Admin"),
        ("+18775550143", "Wells Fargo SMS phishing campaign", "SecOps Automated"),
        ("+18005550166", "Impersonating IRS with cryptocurrency wire request", "Admin")
    ]
    for pattern, reason, by in default_blocked:
        if not db.query(BlockedSender).filter(BlockedSender.pattern == pattern).first():
            db.add(BlockedSender(pattern=pattern, reason=reason, blocked_by=by, active=True))

    # 4. Allowed Senders
    default_allowed = [
        ("+18005550100", "Verified GitHub Security 2FA Gateway", "Admin"),
        ("+18005550188", "Delta Airlines Dispatch and Flight Notifications", "SecOps"),
        ("+18004321000", "Bank of America Verified Customer Notification Shortcode", "Admin")
    ]
    for pattern, desc, by in default_allowed:
        if not db.query(AllowedSender).filter(AllowedSender.pattern == pattern).first():
            db.add(AllowedSender(pattern=pattern, description=desc, added_by=by, active=True))

    # 5. Templates (English and Bengali)
    for tmpl in DEFAULT_TEMPLATES:
        if not db.query(MessageTemplate).filter(MessageTemplate.name == tmpl["name"]).first():
            seg = calculate_sms_segments(tmpl["content"])
            db.add(MessageTemplate(
                name=tmpl["name"],
                content=tmpl["content"],
                category=tmpl["category"],
                is_unicode=seg["is_unicode"],
                char_count=seg["char_count"],
                segment_count=seg["segment_count"],
                created_by="SecOps Lead"
            ))

    # 6. Default Verified Recipients (Consent Granted)
    recipients_data = [
        ("+8801712345678", "Mahbub Alam (Lead Engineer)", "verified", "OPTED_IN", "bn", "Primary authorized engineer endpoint"),
        ("+12025550143", "SecOps Emergency Phone", "verified", "OPTED_IN", "en", "Incident escalation channel"),
        ("+8801812345679", "Tanvir Ahmed (QA Tester)", "unverified", "PENDING", "bn", "Pending authorized OTP verification")
    ]
    for phone, name, v_status, c_status, lang, notes in recipients_data:
        if not db.query(Recipient).filter(Recipient.phone_number == phone).first():
            rec = Recipient(
                phone_number=phone,
                name=name,
                verification_status=v_status,
                consent_status=c_status,
                preferred_language=lang,
                consent_date=now if c_status == "OPTED_IN" else None,
                notes=notes
            )
            db.add(rec)
            db.flush()

            db.add(ConsentRecord(
                recipient_id=rec.id,
                action="INITIAL_SEED_CONSENT",
                method="ADMIN_INITIALIZED",
                details=f"Initial consent setup with status {c_status}",
                timestamp=now
            ))

    db.commit()

    # 7. Seed Sample Automation Job if none exists
    if db.query(AutomationJob).count() == 0:
        first_recipient = db.query(Recipient).filter(Recipient.consent_status == "OPTED_IN").first()
        first_template = db.query(MessageTemplate).filter(MessageTemplate.category == "BENGALI_NOTICE").first()
        if first_recipient and first_template:
            job = AutomationJob(
                name="Security Notice Dispatch (Dhaka Ops)",
                recipient_id=first_recipient.id,
                template_id=first_template.id,
                target_count=3,
                sent_count=1,
                failed_count=0,
                interval_seconds=15.0,
                status="RUNNING",
                execution_mode="MOCK_GATEWAY",
                provider_rate_limit_per_min=10,
                created_by="admin@smsshield.io"
            )
            db.add(job)
            db.flush()

            # Add sample delivery event
            db.add(DeliveryEvent(
                job_id=job.id,
                recipient_phone=first_recipient.phone_number,
                message_content=first_template.content,
                provider_message_id="MOCK-SMSC-DEMO9812",
                delivery_status="SIMULATED_DELIVERED",
                provider_name="MockCarrierGateway",
                is_simulated=True,
                cost_usd=0.0,
                timestamp=now - timedelta(minutes=5)
            ))
            db.commit()

    # 8. Historical Messages if table empty
    if db.query(Message).count() < 10:
        for idx, (content, sender, risk, level, status, rules) in enumerate(HISTORICAL_MESSAGES):
            days_ago = (idx % 7)
            hours_ago = (idx * 3) % 24
            msg_time = now - timedelta(days=days_ago, hours=hours_ago, minutes=idx * 7)

            sender_record = db.query(Sender).filter(Sender.phone_number == sender).first()
            if not sender_record:
                reputation = 20.0 if risk >= 75.0 else (60.0 if risk >= 40.0 else 98.0)
                sender_record = Sender(
                    phone_number=sender,
                    display_name=f"Carrier {sender[-4:]}",
                    reputation_score=reputation,
                    total_messages=1,
                    spam_messages=1 if risk >= 60.0 else 0,
                    created_at=msg_time,
                    last_seen_at=msg_time
                )
                db.add(sender_record)
                db.flush()
            else:
                sender_record.total_messages += 1
                if risk >= 60.0:
                    sender_record.spam_messages += 1

            msg = Message(
                sender_id=sender_record.id,
                raw_sender=sender,
                recipient="+10000000000",
                content=content,
                content_hash=compute_hash(content),
                status=status,
                risk_score=risk,
                created_at=msg_time
            )
            db.add(msg)
            db.flush()

            det = DetectionResult(
                message_id=msg.id,
                layer1_score=min(100.0, risk * 0.95),
                layer2_score=min(100.0, risk * 0.8),
                layer3_score=min(100.0, risk * 1.05),
                composite_score=risk,
                risk_level=level,
                matched_rules=rules,
                statistical_flags=["Velocity normal"] if risk < 60 else ["Elevated frequency risk"],
                ml_model_name="TF-IDF + Logistic Regression Ensemble",
                ml_confidence=round(min(0.99, max(0.65, risk / 100.0)), 3),
                recommended_action="BLOCK" if status == "blocked" else ("QUARANTINE" if status == "quarantined" else "ALLOW"),
                processing_time_ms=round(random.uniform(1.2, 4.8), 2),
                created_at=msg_time
            )
            db.add(det)

            if risk >= 75.0:
                sec_ev = SecurityEvent(
                    event_type="PHISHING_CAMPAIGN_INTERCEPT" if "phishing" in level.lower() else "MALICIOUS_SMS_FLAGGED",
                    severity="CRITICAL" if risk >= 85.0 else "HIGH",
                    title=f"Threat Detected: {sender}",
                    description=f"Automated interception of high-risk SMS. Risk: {risk}/100. Action: {status.upper()}.",
                    sender=sender,
                    message_snippet=content[:120],
                    metadata_json={"risk_score": risk, "action": status},
                    created_at=msg_time
                )
                db.add(sec_ev)

        db.commit()
