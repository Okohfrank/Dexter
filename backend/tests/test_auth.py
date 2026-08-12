import pytest
import uuid

@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "full_name": "New User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_duplicate_email(client, authenticated_user):
    # Try to register with an existing email
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@dexter.ai",
            "password": "anotherpassword",
            "full_name": "Duplicate User"
        }
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"

@pytest.mark.asyncio
async def test_login_user(client, authenticated_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@dexter.ai",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_wrong_password(client, authenticated_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@dexter.ai",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"
