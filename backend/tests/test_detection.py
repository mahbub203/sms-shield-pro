def test_analyze_benign_message(client):
    response = client.post(
        "/api/v1/detection/analyze",
        json={
            "sender": "+12025550111",
            "content": "Hey Alex, are we still meeting for lunch at 12:30 PM today?",
            "recipient": "+10000000000"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["composite_score"] < 35.0
    assert data["risk_level"] == "SAFE"
    assert data["recommended_action"] == "ALLOW"

def test_analyze_critical_phishing_message(client):
    response = client.post(
        "/api/v1/detection/analyze",
        json={
            "sender": "+12025550999",
            "content": "URGENT: Your Wells Fargo account has been locked due to suspicious activity. Verify credentials at http://bit.ly/secure-wf-verify now!",
            "recipient": "+10000000000"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["composite_score"] >= 80.0
    assert data["risk_level"] in ["PHISHING_THREAT", "HIGH_RISK"]
    assert data["recommended_action"] in ["BLOCK", "QUARANTINE"]
    assert len(data["matched_rules"]) > 0

def test_get_ml_performance_metrics(client):
    response = client.get("/api/v1/detection/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert data["accuracy"] > 0.90
    assert "confusion_matrix" in data
    assert len(data["confusion_matrix"]) == 2
    assert "f1_score" in data
    assert data["f1_score"] > 0.90

def test_detection_history(client):
    response = client.get("/api/v1/detection/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
