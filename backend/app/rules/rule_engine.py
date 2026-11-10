import re
from typing import Dict, List, Any, Tuple

# Regex Patterns for Phishing, Urgency, Suspicious URLs, and Credentials
SUSPICIOUS_URL_REGEX = re.compile(
    r'(https?://(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|ow\.ly|cutt\.ly|rb\.gy|v\.gd|shorte\.st|'
    r'[a-zA-Z0-9-]+\.(?:top|xyz|click|work|buzz|club|gq|ml|cf|ga|rest|monster|site|online|live|cam|loan|icu|vip|surf))'
    r'|https?://(?:\d{1,3}\.){3}\d{1,3}'
    r'|https?://[a-zA-Z0-9-]+\.(?:bank|apple|paypal|amazon|chase|wellsfargo|netflix|crypto|binance)[a-zA-Z0-9-]*\.[a-z]{2,})',
    re.IGNORECASE
)

GENERIC_URL_REGEX = re.compile(
    r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)',
    re.IGNORECASE
)

PHISHING_KEYWORDS = [
    r'\baccount (?:has been |is )?(?:suspended|locked|deactivated|frozen|terminated|restricted)\b',
    r'\bunauthorized (?:access|activity|login|transaction|charge)\b',
    r'\bverify (?:your |the )?(?:account|identity|ssn|billing|credentials|wallet|pin)\b',
    r'\bimmediate(?:ly)? action required\b',
    r'\bsecurity (?:alert|breach|notification|warning|update)\b',
    r'\bfailed login attempt\b',
    r'\bconfirm your (?:details|password|pin|identity|banking)\b',
    r'\blogin to (?:restore|unlock|reactivate)\b'
]

URGENT_PAYMENT_KEYWORDS = [
    r'\bwire (?:transfer|funds|money)\b',
    r'\bcrypto(?:currency)? (?:transfer|deposit|address|wallet|btc|eth|usdt)\b',
    r'\bgift card(?:s)?\b',
    r'\bclaim (?:your )?(?:prize|lottery|reward|cash bonus|\$\d+)\b',
    r'\bselected for (?:a grant|free reward|\$\d+ loan)\b',
    r'\bpay (?:now|immediately|within \d+ hours?)\b',
    r'\bdebt (?:relief|forgiveness|settlement)\b',
    r'\bwestern union|moneygram|venmo|zelle|cashapp\b'
]

DELIVERY_SCAM_KEYWORDS = [
    r'\bparcel (?:delivery|shipment) (?:failed|held|pending|delayed)\b',
    r'\bunpaid (?:postage|customs|shipping fee)\b',
    r'\bpackage (?:requires|needs) (?:update|action|address confirmation)\b',
    r'\busps|fedex|ups|dhl tracking alert\b'
]

IMPERSONATION_BRANDS = [
    r'\bwells fargo\b', r'\bchase bank\b', r'\bbank of america\b', r'\bciti(?:bank)?\b',
    r'\bpaypal\b', r'\bvenmo\b', r'\bapple pay\b', r'\bamazon security\b',
    r'\birs notification\b', r'\bsocial security administration\b', r'\bbinance\b', r'\bcoinbase\b'
]

class RuleEngine:
    """Layer 1: Rule-Based & Heuristic Detection Engine"""

    def analyze(self, content: str, sender: str = "") -> Tuple[float, List[str]]:
        matched_rules: List[str] = []
        score = 0.0
        text_lower = content.lower()

        # 1. Suspicious URL Checks
        suspicious_urls = SUSPICIOUS_URL_REGEX.findall(content)
        if suspicious_urls:
            score += 45.0
            matched_rules.append(f"Suspicious / Shortened URL detected ({len(suspicious_urls)} instances)")
        elif GENERIC_URL_REGEX.search(content):
            # Normal URL present in SMS adds baseline scrutiny
            score += 15.0
            matched_rules.append("Embedded link detected in SMS payload")

        # 2. Phishing Language & Urgency
        for pattern in PHISHING_KEYWORDS:
            if re.search(pattern, text_lower):
                score += 30.0
                clean_term = pattern.replace(r'\b', '').replace(r'(?:', '').replace(r')', '')
                matched_rules.append(f"Phishing urgency marker: '{clean_term}'")
                break

        # 3. Urgent Payment / Crypto / Prize Requests
        for pattern in URGENT_PAYMENT_KEYWORDS:
            if re.search(pattern, text_lower):
                score += 35.0
                matched_rules.append("Urgent payment / financial reward solicitation")
                break

        # 4. Delivery Scam Markers
        for pattern in DELIVERY_SCAM_KEYWORDS:
            if re.search(pattern, text_lower):
                score += 30.0
                matched_rules.append("Impersonation of parcel delivery / shipping courier")
                break

        # 5. Financial / Tech Brand Impersonation
        for pattern in IMPERSONATION_BRANDS:
            if re.search(pattern, text_lower):
                score += 25.0
                matched_rules.append("Targeted financial or institution brand impersonation")
                break

        # 6. Sensitive Data Solicitation (PIN, OTP, SSN)
        if re.search(r'\b(?:reply with|send|enter) (?:your )?(?:code|pin|otp|ssn|password)\b', text_lower):
            score += 40.0
            matched_rules.append("Direct solicitation of sensitive credential / OTP / PIN")

        # 7. Shouting / Excessive Punctuation
        if sum(1 for c in content if c.isupper()) / max(len(content), 1) > 0.45 and len(content) > 20:
            score += 15.0
            matched_rules.append("Excessive uppercase shouting detected (>45%)")

        if content.count('!') + content.count('?') >= 3:
            score += 10.0
            matched_rules.append("Excessive exclamations or urgency punctuation")

        # Cap Layer 1 score at 100.0
        final_score = min(score, 100.0)
        return final_score, matched_rules

rule_engine = RuleEngine()
