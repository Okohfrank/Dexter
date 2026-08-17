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
    assert data["user"]["email"] == "newuser@example.com"
    assert "id" in data["user"]
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["is_verified"] is False

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

@pytest.mark.asyncio
async def test_verify_email(client, db_session):
    from app.core.security import create_verification_token
    from app.models.user import User
    from app.core.security import hash_password
    user = User(
        email="unverified@dexter.ai",
        hashed_password=hash_password("testpass123"),
        full_name="Unverified User",
        is_active=True,
        is_verified=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_verification_token(user.id)
    response = await client.post(
        "/api/v1/auth/verify-email",
        json={"token": token}
    )
    assert response.status_code == 200
    assert response.json()["is_verified"] is True

@pytest.mark.asyncio
async def test_verify_email_invalid_token(client):
    response = await client.post(
        "/api/v1/auth/verify-email",
        json={"token": "not-a-real-token"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_verify_email_already_verified(client, authenticated_user):
    from app.core.security import create_verification_token
    token = create_verification_token(authenticated_user["user"].id)
    response = await client.post("/api/v1/auth/verify-email", json={"token": token})
    assert response.status_code == 409

@pytest.mark.asyncio
async def test_resend_verification_unknown_email(client):
    response = await client.post(
        "/api/v1/auth/resend-verification",
        json={"email": "nobody@dexter.ai"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_refresh_token(client, authenticated_user):
    from app.core.security import create_refresh_token
    refresh_token = create_refresh_token({"sub": str(authenticated_user["user"].id)})
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
