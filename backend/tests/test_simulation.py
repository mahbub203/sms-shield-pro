def test_simulation_scenarios_list(client):
    res = client.get("/api/v1/simulation/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 5
    scenario_ids = [s["id"] for s in scenarios]
    assert "bank_phishing" in scenario_ids
    assert "delivery_scam" in scenario_ids

def test_run_simulation_batch(client):
    res = client.post(
        "/api/v1/simulation/start",
        json={
            "name": "Integration Test Batch",
            "scenario": "bank_phishing",
            "message_count": 5,
            "frequency_per_sec": 10.0
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["total_processed"] == 5
    assert (data["total_phishing"] + data["total_spam"]) >= 3
    assert data["avg_latency_ms"] > 0
