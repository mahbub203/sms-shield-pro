def test_blocklist_crud_and_enforcement(client):
    # Add new sender to blocklist
    test_pattern = "+19998887777"
    post_res = client.post(
        "/api/v1/protection/blocklist",
        json={"pattern": test_pattern, "reason": "Automated spam test bot"}
    )
    assert post_res.status_code == 200
    entry_id = post_res.json()["id"]

    # Verify message from blocked sender is immediately blocked
    msg_res = client.post(
        "/api/v1/detection/analyze",
        json={"sender": test_pattern, "content": "Simple harmless greeting"}
    )
    assert msg_res.status_code == 200
    assert msg_res.json()["recommended_action"] == "BLOCK"
    assert msg_res.json()["composite_score"] == 100.0

    # Remove from blocklist
    del_res = client.delete(f"/api/v1/protection/blocklist/{entry_id}")
    assert del_res.status_code == 200

def test_allowlist_crud(client):
    pattern = "+18880001111"
    res = client.post(
        "/api/v1/protection/allowlist",
        json={"pattern": pattern, "description": "Trusted hospital emergency notification gateway"}
    )
    assert res.status_code == 200
    entry_id = res.json()["id"]

    list_res = client.get("/api/v1/protection/allowlist")
    assert any(item["pattern"] == pattern for item in list_res.json())

    # Delete
    del_res = client.delete(f"/api/v1/protection/allowlist/{entry_id}")
    assert del_res.status_code == 200

def test_emergency_mode_toggle(client):
    res = client.post(
        "/api/v1/protection/emergency-mode",
        json={"enabled": True}
    )
    assert res.status_code == 200
    assert res.json()["emergency_lockdown_mode"] is True

    # Revert back to normal
    res2 = client.post(
        "/api/v1/protection/emergency-mode",
        json={"enabled": False}
    )
    assert res2.status_code == 200
    assert res2.json()["emergency_lockdown_mode"] is False
