import math
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session

from app.models import Message, Sender
from app.config import settings

def calculate_shannon_entropy(text: str) -> float:
    """Computes Shannon entropy of string to identify high-randomness/obfuscated strings."""
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    char_counts = {}
    for char in text:
        char_counts[char] = char_counts.get(char, 0) + 1
    for count in char_counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy

def compute_hash(text: str) -> str:
    """Computes normalized SHA256 content hash."""
    clean_text = "".join(text.lower().split())
    return hashlib.sha256(clean_text.encode("utf-8")).hexdigest()

class StatisticalAnalyzer:
    """Layer 2: Statistical, Velocity, and Behavioral Detection"""

    def analyze(
        self,
        db: Session,
        sender_phone: str,
        content: str
    ) -> Tuple[float, List[str], Dict[str, Any]]:
        flags: List[str] = []
        score = 0.0
        details = {}
        now = datetime.utcnow()

        content_hash = compute_hash(content)
        details["content_hash"] = content_hash

        # 1. Message Frequency / Velocity Analysis (Last 1 minute)
        one_min_ago = now - timedelta(minutes=1)
        recent_count = db.query(Message).filter(
            Message.raw_sender == sender_phone,
            Message.created_at >= one_min_ago
        ).count()
        details["messages_last_minute"] = recent_count

        if recent_count >= settings.DEFAULT_RATE_LIMIT_PER_MINUTE:
            score += 45.0
            flags.append(f"High velocity burst detected: {recent_count} msgs in last 60s (threshold: {settings.DEFAULT_RATE_LIMIT_PER_MINUTE})")
        elif recent_count >= 3:
            score += 20.0
            flags.append(f"Elevated transmission frequency: {recent_count} msgs in last 60s")

        # 2. Duplicate Content Tracking (Last 10 minutes)
        window_ago = now - timedelta(minutes=settings.DUPLICATE_TIME_WINDOW_MINUTES)
        duplicate_count = db.query(Message).filter(
            Message.content_hash == content_hash,
            Message.created_at >= window_ago
        ).count()
        details["duplicate_count_window"] = duplicate_count

        if duplicate_count >= 3:
            score += 35.0
            flags.append(f"Duplicate broadcast spam signature: identical message seen {duplicate_count} times recently")
        elif duplicate_count >= 1:
            score += 15.0
            flags.append("Repeated message payload detected")

        # 3. Sender Historical Behavior
        sender_record = db.query(Sender).filter(Sender.phone_number == sender_phone).first()
        if sender_record:
            details["sender_total"] = sender_record.total_messages
            details["sender_spam"] = sender_record.spam_messages
            details["sender_reputation"] = sender_record.reputation_score

            if sender_record.reputation_score < 40.0:
                score += 30.0
                flags.append(f"Sender historical reputation degraded ({sender_record.reputation_score:.1f}/100)")
            elif sender_record.reputation_score < 70.0:
                score += 15.0
                flags.append(f"Sender under surveillance ({sender_record.reputation_score:.1f}/100)")
        else:
            details["sender_status"] = "new_or_unregistered"

        # 4. Text Entropy Analysis (High entropy indicates obfuscated base64/hex tokens or randomized domains)
        entropy = calculate_shannon_entropy(content)
        details["shannon_entropy"] = round(entropy, 3)
        if entropy > 4.6 and len(content) > 30:
            score += 15.0
            flags.append(f"Abnormal informational entropy ({entropy:.2f} bits/char) suggesting encoded obfuscation")

        # 5. Non-ASCII / Homoglyph / Zero-Width Space Detection
        non_ascii_count = sum(1 for c in content if ord(c) > 127)
        details["non_ascii_chars"] = non_ascii_count
        if non_ascii_count > 3:
            score += 20.0
            flags.append(f"Suspicious unicode/non-ASCII characters ({non_ascii_count}) indicating possible homoglyph spoofing")

        # 6. Numeric and Symbol Density
        digits = sum(1 for c in content if c.isdigit())
        specials = sum(1 for c in content if not c.isalnum() and not c.isspace())
        total_len = max(len(content), 1)
        digit_ratio = digits / total_len
        special_ratio = specials / total_len
        
        details["digit_ratio"] = round(digit_ratio, 3)
        details["special_ratio"] = round(special_ratio, 3)

        if digit_ratio > 0.25 and len(content) > 30:
            score += 10.0
            flags.append("High numeric character density")

        if special_ratio > 0.20:
            score += 10.0
            flags.append("High special symbol density")

        final_score = min(score, 100.0)
        return final_score, flags, details

stats_analyzer = StatisticalAnalyzer()
