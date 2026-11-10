def test_admin_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@smsshield.io", "password": "Admin@Shield2026!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@smsshield.io"
    assert data["user"]["role"] == "admin"

def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@smsshield.io", "password": "WrongPassword123!"}
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_current_user_me(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "admin@smsshield.io"

def test_protected_route_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
