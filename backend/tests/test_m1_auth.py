"""Tests for M1 Authentication & Account Linking (REQ-1.x)."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.core.security import hash_password


# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    """Test client with overridden database."""
    def override_get_db():
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestRegister:
    """Tests for POST /auth/register (REQ-1.1)."""

    def test_register_success(self, client):
        """Register a new user successfully."""
        response = client.post(
            "/auth/register",
            json={
                "username": "newuser",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "hashed_password" not in data  # Never return password

    def test_register_duplicate_email(self, client, db):
        """Reject registration with duplicate email (REQ-1.1)."""
        # Create first user
        client.post(
            "/auth/register",
            json={
                "username": "user1",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        # Try to register with same email
        response = client.post(
            "/auth/register",
            json={
                "username": "user2",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_duplicate_username(self, client, db):
        """Reject registration with duplicate username (REQ-1.1)."""
        # Create first user
        client.post(
            "/auth/register",
            json={
                "username": "sameuser",
                "email": "test1@example.com",
                "password": "securepassword123"
            }
        )
        # Try to register with same username
        response = client.post(
            "/auth/register",
            json={
                "username": "sameuser",
                "email": "test2@example.com",
                "password": "securepassword123"
            }
        )
        assert response.status_code == 400
        assert "already taken" in response.json()["detail"].lower()

    def test_register_short_password(self, client):
        """Reject password shorter than 8 characters."""
        response = client.post(
            "/auth/register",
            json={
                "username": "newuser",
                "email": "test@example.com",
                "password": "short"
            }
        )
        assert response.status_code == 422  # Validation error


class TestLogin:
    """Tests for POST /auth/login (REQ-1.2, REQ-1.6)."""

    @pytest.fixture
    def test_user(self, db):
        """Create a test user."""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=hash_password("correctpassword"),
            is_active=True
        )
        db.add(user)
        db.commit()
        return user

    def test_login_success(self, client, test_user):
        """Login with correct credentials (REQ-1.2)."""
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "correctpassword"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@example.com"

    def test_login_incorrect_password(self, client, test_user):
        """Reject incorrect password with generic message (no enumeration)."""
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        # Generic message prevents user enumeration
        assert "incorrect email or password" in response.json()["detail"].lower()

    def test_login_nonexistent_email(self, client):
        """Reject login for nonexistent email (no enumeration)."""
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "anypassword"
            }
        )
        assert response.status_code == 401
        assert "incorrect email or password" in response.json()["detail"].lower()


class TestLogout:
    """Tests for POST /auth/logout (REQ-1.6)."""

    def test_logout_success(self, client, db):
        """Logout returns success message."""
        # First, register and login to get a token
        client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        login_response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Logout with token
        response = client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert "logged out" in response.json()["message"].lower()


class TestJudgeLink:
    """Tests for judge account linking (REQ-1.3–1.5)."""

    def test_link_judge_success(self, client, db):
        """Successfully request judge profile linking (REQ-1.3)."""
        # Register and login
        client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        login_response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Link judge
        response = client.post(
            "/auth/judges/link",
            json={
                "judge_name": "codeforces",
                "handle": "myhandle123"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "verification_token" in data
        assert data["linked_profile"]["handle"] == "myhandle123"
        assert data["linked_profile"]["verified"] is False

    def test_link_duplicate_judge(self, client, db):
        """Reject linking same judge twice (REQ-1.3)."""
        # Register and login
        client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        login_response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Link first time
        client.post(
            "/auth/judges/link",
            json={"judge_name": "codeforces", "handle": "handle1"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Try to link again
        response = client.post(
            "/auth/judges/link",
            json={"judge_name": "codeforces", "handle": "handle2"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400
        assert "already linked" in response.json()["detail"].lower()

    def test_unlink_judge_success(self, client, db):
        """Successfully unlink a judge (REQ-1.5)."""
        # Register, login, and link
        client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        login_response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        client.post(
            "/auth/judges/link",
            json={"judge_name": "codeforces", "handle": "myhandle"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Unlink
        response = client.delete(
            "/auth/judges/codeforces",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert "unlinked" in response.json()["message"].lower()

    def test_unlink_nonexistent_judge(self, client, db):
        """Reject unlinking a judge that's not linked."""
        # Register and login
        client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        login_response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Try to unlink without linking first
        response = client.delete(
            "/auth/judges/codeforces",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404
