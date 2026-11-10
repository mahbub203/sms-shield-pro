import fnmatch
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models import (
    Sender, Message, DetectionResult, BlockedSender, AllowedSender,
    SecurityEvent, SystemSetting
)
from app.rules.rule_engine import rule_engine
from app.statistical.stats_analyzer import stats_analyzer, compute_hash
from app.ml.detector import ml_detector
from app.config import settings

def match_pattern(pattern: str, value: str) -> bool:
    """Matches exact or wildcard patterns like +1800* or +12025550143."""
    if pattern == value:
        return True
    if "*" in pattern or "?" in pattern:
        return fnmatch.fnmatch(value, pattern)
    return False

class ProtectionManager:
    """Enterprise Policy Enforcement, Rate Limiting, and Multi-Layer Threat Evaluation"""

    def is_sender_allowed(self, db: Session, sender: str) -> Tuple[bool, Optional[str]]:
        allowed = db.query(AllowedSender).filter(AllowedSender.active == True).all()
        for item in allowed:
            if match_pattern(item.pattern, sender):
                return True, item.description
        return False, None

    def is_sender_blocked(self, db: Session, sender: str) -> Tuple[bool, Optional[str]]:
        blocked = db.query(BlockedSender).filter(BlockedSender.active == True).all()
        now = datetime.now(timezone.utc)
        for item in blocked:
            if item.expires_at and item.expires_at.replace(tzinfo=timezone.utc) < now:
                continue
            if match_pattern(item.pattern, sender):
                return True, item.reason
        return False, None

    def is_emergency_mode_active(self, db: Session) -> bool:
        setting = db.query(SystemSetting).filter(SystemSetting.key == "emergency_lockdown_mode").first()
        return setting.value.lower() == "true" if setting else False

    def process_and_analyze_message(
        self,
        db: Session,
        sender_phone: str,
        content: str,
        recipient: str = "+10000000000",
        session_id: Optional[int] = None
    ) -> Message:
        start_time = datetime.now()
        content_hash = compute_hash(content)

        # 1. Check Allowlist
        is_allowed, allow_reason = self.is_sender_allowed(db, sender_phone)

        # 2. Check Blocklist
        is_blocked, block_reason = self.is_sender_blocked(db, sender_phone)

        # 3. Check Emergency Mode
        emergency_mode = self.is_emergency_mode_active(db)

        # Run Multi-Layer Detection
        # Layer 1: Rules
        l1_score, l1_rules = rule_engine.analyze(content, sender_phone)

        # Layer 2: Statistical & Velocity
        l2_score, l2_flags, l2_details = stats_analyzer.analyze(db, sender_phone, content)

        # Layer 3: Machine Learning
        l3_score, ml_confidence, top_terms, ml_model_name = ml_detector.predict(content)

        # Calculate Composite Risk Score (0-100)
        # Weights: Layer 1 (35%), Layer 2 (25%), Layer 3 (40%)
        composite = (0.35 * l1_score) + (0.25 * l2_score) + (0.40 * l3_score)

        # Synergistic Phishing Boost: if both L1 and L3 detect high risk, reinforce score
        if l1_score >= 40.0 and l3_score >= 60.0:
            composite = min(100.0, composite + 12.0)

        # Allowlist mitigation (if allowlisted and not extreme payload)
        if is_allowed and l1_score < 70.0:
            composite = max(0.0, composite - 50.0)

        # Determine Risk Level & Action
        if is_blocked:
            composite = 100.0
            risk_level = "CRITICAL_BLOCKED"
            action = "BLOCK"
            status = "blocked"
        elif emergency_mode and not is_allowed:
            composite = max(composite, 85.0)
            risk_level = "EMERGENCY_LOCKDOWN_HELD"
            action = "BLOCK"
            status = "blocked"
        elif composite >= 80.0:
            risk_level = "PHISHING_THREAT"
            action = "BLOCK"
            status = "blocked"
        elif composite >= 60.0:
            risk_level = "HIGH_RISK"
            action = "QUARANTINE"
            status = "quarantined"
        elif composite >= 35.0:
            risk_level = "SUSPICIOUS"
            action = "FLAG"
            status = "allowed"
        else:
            risk_level = "SAFE"
            action = "ALLOW"
            status = "allowed"

        # Track Processing Latency
        duration_ms = (datetime.now() - start_time).total_seconds() * 1000.0

        # Update or Create Sender record
        sender_record = db.query(Sender).filter(Sender.phone_number == sender_phone).first()
        if not sender_record:
            is_shortcode = len(sender_phone.replace("+", "")) <= 6
            sender_record = Sender(
                phone_number=sender_phone,
                display_name=f"Carrier {sender_phone[-4:]}",
                is_shortcode=is_shortcode,
                reputation_score=100.0,
                total_messages=0,
                spam_messages=0
            )
            db.add(sender_record)
            db.flush()

        sender_record.total_messages += 1
        if composite >= 60.0:
            sender_record.spam_messages += 1
            # Degrade reputation proportionally
            penalty = 12.0 if composite >= 80.0 else 6.0
            sender_record.reputation_score = max(0.0, sender_record.reputation_score - penalty)
        else:
            # Gradually restore reputation
            sender_record.reputation_score = min(100.0, sender_record.reputation_score + 0.5)

        # Persist Message
        message = Message(
            sender_id=sender_record.id,
            raw_sender=sender_phone,
            recipient=recipient,
            content=content,
            content_hash=content_hash,
            status=status,
            risk_score=round(composite, 2),
            session_id=session_id
        )
        db.add(message)
        db.flush()

        # Combine detected reasons
        all_rules = list(l1_rules)
        if is_blocked:
            all_rules.insert(0, f"Sender matched active blocklist rule: {block_reason}")
        if is_allowed:
            all_rules.append(f"Sender in verified allowlist: {allow_reason}")
        if top_terms:
            all_rules.append(f"ML key suspicious tokens: {', '.join(top_terms)}")

        # Persist Detection Result
        detection_result = DetectionResult(
            message_id=message.id,
            layer1_score=round(l1_score, 2),
            layer2_score=round(l2_score, 2),
            layer3_score=round(l3_score, 2),
            composite_score=round(composite, 2),
            risk_level=risk_level,
            matched_rules=all_rules,
            statistical_flags=l2_flags,
            ml_model_name=ml_model_name,
            ml_confidence=ml_confidence,
            recommended_action=action,
            processing_time_ms=round(duration_ms, 2)
        )
        db.add(detection_result)

        # Log Security Events for High-Risk and Phishing Threats
        if composite >= 60.0 or is_blocked or (emergency_mode and not is_allowed):
            severity = "CRITICAL" if composite >= 80.0 or is_blocked else "HIGH"
            event_type = "PHISHING_ATTEMPT" if composite >= 80.0 else "SUSPICIOUS_SPAM_DETECTED"
            if is_blocked:
                event_type = "BLOCKLIST_ENFORCEMENT"
            elif emergency_mode and not is_allowed:
                event_type = "EMERGENCY_LOCKDOWN_INTERCEPT"

            sec_event = SecurityEvent(
                event_type=event_type,
                severity=severity,
                title=f"{risk_level}: Message from {sender_phone}",
                description=f"Action: {action}. Risk Score: {composite:.1f}/100. Reasons: {'; '.join(all_rules[:3])}",
                sender=sender_phone,
                message_snippet=content[:140],
                metadata_json={
                    "risk_score": composite,
                    "action": action,
                    "l1": l1_score,
                    "l2": l2_score,
                    "l3": l3_score,
                    "message_id": message.id
                }
            )
            db.add(sec_event)

        db.commit()
        db.refresh(message)
        return message

protection_manager = ProtectionManager()
