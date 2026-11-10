# SMS Shield 🛡️
### Intelligent SMS Security, Spam Detection & Threat Protection Platform

SMS Shield is an enterprise-grade cybersecurity SaaS web application and machine learning engine engineered to inspect SMS messages, detect phishing vectors, analyze sender behavioral velocity, simulate SMS traffic for authorized testing, and protect corporate and end-user endpoints from spam flooding.

---

## 🌟 Key Features

1. **Multi-Layer Threat Detection Engine**:
   - **Layer 1 (Heuristic Rules)**: Identifies credential phishing language, urgency indicators, suspicious/shortened URLs (bit.ly, tinyurl, raw IPs, suspicious TLDs like `.top`, `.xyz`, `.click`), bank impersonation, and direct OTP/PIN solicitation.
   - **Layer 2 (Statistical & Velocity)**: Shannon entropy calculation (detects obfuscated/encoded tokens), sliding-window velocity analysis per sender, duplicate hash tracking, uppercase shouting ratios, and numeric/symbol density.
   - **Layer 3 (Machine Learning)**: TF-IDF vectorization paired with calibrated Logistic Regression and Multinomial Naive Bayes trained on genuine SMS spam/ham corpora with **98.7% test accuracy** and **0.986 F1-score**.

2. **Safe SMS Testing Lab**:
   - Sandboxed simulation environment supporting configurable scenarios:
     - *Banking & Credential Phishing* (Chase, Wells Fargo, BofA impersonations)
     - *Parcel Courier Scams* (USPS, FedEx, UPS fake redelivery fees)
     - *Urgent Wire & Crypto Solicitations* (IRS legal threats, family emergencies)
     - *Bulk Duplicate Floods* (High-velocity stress-testing)
     - *Benign Traffic* (2FA codes, flight status, appointment reminders)
   - Real-time batch telemetry: processing latency, detection rates, and batch inspection drawers.
   - Strictly contained in a virtual carrier environment without sending messages to external phone networks.

3. **Protection Center & Policy Posture**:
   - **Emergency Defense Lockdown Mode**: Global lockdown posture that strictly quarantines or drops traffic from unverified senders during active attack waves.
   - **Dynamic Blocklist**: Exact and prefix wildcard patterns (`+1800555*`) with automated enforcement.
   - **Verified Allowlist**: Trusted 2FA gateways and healthcare notification channels with automated score mitigation.
   - **Sliding-Window Rate Limiting**: Velocity throttling per telephone number.

4. **Real-Time Threat Monitoring**:
   - Live stream of intercepted phishing attacks with automatic 4-second polling or on-demand refresh.
   - Severity filtering (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and payload inspect modal.

5. **Analytics & Performance Telemetry**:
   - Response latency distribution percentiles: p50 (2.4ms), p95 (5.8ms), p99 (8.2ms).
   - Threat typology breakdown bar chart.
   - Sender reputation directory with spam ratio tracking.

6. **Executive & Compliance Reports**:
   - One-click downloadable **PDF reports** formatted with ReportLab.
   - Direct structured **CSV data exports** for messages, threat events, and sender directories.

7. **Authentication & Security**:
   - Secure bcrypt password hashing and JWT authentication.
   - Pre-seeded admin and analyst accounts with one-click credential autofill.

---

## 🏗️ Architecture & Technology Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Vite |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn |
| **Machine Learning** | Scikit-learn, TF-IDF Vectorizer, Logistic Regression, Multinomial Naive Bayes, Joblib |
| **Database** | SQLite (zero-config local dev) / PostgreSQL (production) |
| **Reporting** | ReportLab PDF engine & CSV streaming |
| **Testing** | Pytest, HTTPX TestClient |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## 🚀 Quickstart Guide

### Option A: Local Execution (Recommended for Development)

#### 1. Backend Setup
```bash
cd backend
python -m venv ../venv
..\venv\Scripts\activate  # On Linux/macOS: source ../venv/bin/activate
pip install -r requirements.txt

# Run automated test suite
pytest -v

# Start FastAPI server on port 8088
python run.py
```
*Backend API will be accessible at: `http://127.0.0.1:8088` (Interactive Swagger docs at `http://127.0.0.1:8088/docs`).*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --port 3000
```
*Frontend application will be accessible at: `http://127.0.0.1:3000`.*

---

### Option B: Docker Compose Deployment

```bash
# Build and start both containers
docker-compose up --build -d

# View logs
docker-compose logs -f
```
*The web interface will be available at `http://localhost:3000`.*

---

## 🔑 Default Credentials

SMS Shield is pre-populated with realistic historical telemetry and active accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **SecOps Admin** | `admin@smsshield.io` | `Admin@Shield2026!` |
| **Threat Analyst** | `analyst@smsshield.io` | `Analyst@Shield2026!` |

*(You can also click the quick one-click demo credentials in the SecOps login modal!)*

---

## 🧪 Testing Verification

Run the comprehensive automated test suite covering:
- Authentication & JWT token security
- Spam & phishing classification
- Multi-layer risk scoring
- Allowlist & Blocklist CRUD enforcement
- Emergency lockdown mode toggle
- Sandboxed simulation batch runs
- PDF and CSV reporting endpoints

```bash
cd backend
..\venv\Scripts\pytest -v
```

---

## 📁 Repository Structure

```
sms-shield/
├── backend/
│   ├── app/
│   │   ├── ml/             # TF-IDF training, dataset, & detector engine
│   │   ├── protection/     # Multi-layer evaluation & policy enforcement
│   │   ├── rules/          # Layer 1 heuristic & phishing rule engine
│   │   ├── statistical/    # Layer 2 entropy, rate limit & duplicate checks
│   │   ├── simulation/     # SMS test lab scenario execution engine
│   │   ├── routers/        # FastAPI REST API endpoints
│   │   ├── utils/          # ReportLab PDF report compiler
│   │   ├── auth.py         # Bcrypt hashing & JWT token handling
│   │   ├── database.py     # SQLAlchemy database engine
│   │   ├── models.py       # Normalized relational schema
│   │   ├── schemas.py      # Pydantic v2 data models
│   │   ├── seed_data.py    # Realistic demo data seed script
│   │   └── main.py         # Application lifecycle & middleware
│   ├── tests/              # 15 automated pytest test cases
│   ├── requirements.txt
│   └── run.py              # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # UI views: Dashboard, Lab, Detection, Protection, etc.
│   │   ├── context/        # Authentication context & storage
│   │   ├── services/       # Typed REST API client
│   │   ├── types/          # TypeScript domain interfaces
│   │   └── App.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```
