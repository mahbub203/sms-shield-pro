def test_add_recipient_valid(client):
    res = client.post(
        "/api/v1/automation/recipients",
        json={
            "phone_number": "+8801912345670",
            "name": "Arif Hossain",
            "preferred_language": "bn",
            "notes": "DevOps Engineer"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["phone_number"] == "+8801912345670"
    assert data["verification_status"] == "unverified"
    assert data["consent_status"] == "PENDING"

def test_add_recipient_invalid_phone(client):
    res = client.post(
        "/api/v1/automation/recipients",
        json={
            "phone_number": "12345",
            "name": "Invalid Recipient"
        }
    )
    assert res.status_code == 400
    assert "Invalid phone number" in res.json()["detail"]

def test_verify_recipient_otp(client, db):
    from app.models import Recipient
    rec = db.query(Recipient).filter(Recipient.phone_number == "+8801912345670").first()
    assert rec is not None

    res = client.post(
        f"/api/v1/automation/recipients/{rec.id}/verify",
        json={"code": rec.verification_code}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["verification_status"] == "verified"
    assert data["consent_status"] == "OPTED_IN"

def test_bengali_unicode_segment_calculator(client):
    # Test standard GSM-7
    res_gsm = client.post(
        "/api/v1/automation/templates/inspect-unicode",
        json={"text": "Hello, this is a standard English SMS message."}
    )
    assert res_gsm.status_code == 200
    data_gsm = res_gsm.json()
    assert data_gsm["is_unicode"] is False
    assert data_gsm["is_bengali"] is False
    assert data_gsm["segment_count"] == 1

    # Test Bengali Unicode
    bengali_text = "আপনার ওটিপি (OTP) কোড হল ৭৪৯২০১। নিরাপত্তা নিশ্চিত করতে এই কোড কাউকে জানাবেন না।"
    res_bn = client.post(
        "/api/v1/automation/templates/inspect-unicode",
        json={"text": bengali_text}
    )
    assert res_bn.status_code == 200
    data_bn = res_bn.json()
    assert data_bn["is_unicode"] is True
    assert data_bn["is_bengali"] is True
    assert data_bn["encoding"] == "UCS-2 (Unicode)"

def test_create_and_manage_automation_job(client, db):
    from app.models import Recipient
    rec = db.query(Recipient).filter(Recipient.consent_status == "OPTED_IN").first()
    assert rec is not None

    # Create job
    res = client.post(
        "/api/v1/automation/jobs",
        json={
            "name": "Automated Security Notification Batch",
            "recipient_id": rec.id,
            "custom_message": "Authorized system status update.",
            "target_count": 2,
            "interval_seconds": 5.0,
            "execution_mode": "MOCK_GATEWAY"
        }
    )
    assert res.status_code == 200
    job_data = res.json()
    job_id = job_data["id"]
    assert job_data["status"] == "PENDING"

    # Start job
    start_res = client.post(f"/api/v1/automation/jobs/{job_id}/start")
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "started"

    # Pause job
    pause_res = client.post(f"/api/v1/automation/jobs/{job_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"

    # Resume job
    resume_res = client.post(f"/api/v1/automation/jobs/{job_id}/resume")
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "resumed"

    # Cancel job
    cancel_res = client.post(f"/api/v1/automation/jobs/{job_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

def test_emergency_mode_halts_outbound_delivery(client, db):
    from app.models import Recipient, AutomationJob
    # Enable emergency mode
    client.post("/api/v1/protection/emergency-mode", json={"enabled": True})

    rec = db.query(Recipient).filter(Recipient.consent_status == "OPTED_IN").first()
    job = AutomationJob(
        name="Emergency Test Job",
        recipient_id=rec.id,
        target_count=3,
        status="RUNNING",
        interval_seconds=10.0,
        execution_mode="MOCK_GATEWAY"
    )
    db.add(job)
    db.commit()

    from app.execution.execution_manager import execution_manager
    success, msg = execution_manager.execute_job_tick(db, job.id)
    assert success is False
    assert "Emergency Lockdown is active" in msg
    assert job.status == "PAUSED"

    # Restore emergency mode
    client.post("/api/v1/protection/emergency-mode", json={"enabled": False})

def test_scheduler_stats_endpoint(client):
    res = client.get("/api/v1/scheduler/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_jobs" in data
    assert "worker_status" in data
    assert "total_simulated_delivered" in data
