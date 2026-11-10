import os

class Settings:
    PROJECT_NAME: str = "SMS Shield"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./sms_shield.db"
    )
    
    # JWT Auth
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "sms-shield-super-secret-key-cybersecurity-999-secure-token"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Default Admin Credentials
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@smsshield.io")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@Shield2026!")
    ADMIN_NAME: str = "SecOps Administrator"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Detection Thresholds
    SUSPICIOUS_THRESHOLD: float = 40.0
    HIGH_RISK_THRESHOLD: float = 75.0
    DEFAULT_RATE_LIMIT_PER_MINUTE: int = 5
    DUPLICATE_TIME_WINDOW_MINUTES: int = 10

settings = Settings()
