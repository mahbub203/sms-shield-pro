import re
from typing import Dict, Any, Tuple

GSM_7BIT_CHARS = (
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ`abcdefghijklmnopqrstuvwxyzäöñüà"
)
GSM_7BIT_EXTENDED = "^{}\\[~]|€"

BENGALI_REGEX = re.compile(r'[\u0980-\u09FF]')

def is_unicode_message(text: str) -> bool:
    """Checks if message contains Unicode characters requiring UCS-2 encoding."""
    for char in text:
        if char not in GSM_7BIT_CHARS and char not in GSM_7BIT_EXTENDED:
            return True
    return False

def calculate_sms_segments(text: str) -> Dict[str, Any]:
    """
    Computes exact SMS character length, encoding type, segment count,
    and remaining characters in current segment according to telco standards.
    Supports English (GSM-7) and Bengali / UTF-8 (UCS-2).
    """
    if not text:
        return {
            "char_count": 0,
            "encoding": "GSM-7",
            "is_unicode": False,
            "is_bengali": False,
            "segment_count": 1,
            "max_per_segment": 160,
            "remaining_in_segment": 160
        }

    is_unicode = is_unicode_message(text)
    has_bengali = bool(BENGALI_REGEX.search(text))

    char_count = len(text)

    if is_unicode or has_bengali:
        encoding = "UCS-2 (Unicode)"
        single_limit = 70
        multi_limit = 67
    else:
        # GSM-7. Calculate extended character costs (extended chars like [ ] { } ^ ~ take 2 chars)
        extended_count = sum(1 for c in text if c in GSM_7BIT_EXTENDED)
        char_count = len(text) + extended_count
        encoding = "GSM-7 (Standard)"
        single_limit = 160
        multi_limit = 153

    if char_count <= single_limit:
        segment_count = 1
        remaining = single_limit - char_count
    else:
        segment_count = (char_count + multi_limit - 1) // multi_limit
        total_capacity = segment_count * multi_limit
        remaining = total_capacity - char_count

    return {
        "char_count": char_count,
        "encoding": encoding,
        "is_unicode": is_unicode or has_bengali,
        "is_bengali": has_bengali,
        "segment_count": max(1, segment_count),
        "max_per_segment": single_limit if segment_count == 1 else multi_limit,
        "remaining_in_segment": max(0, remaining)
    }
