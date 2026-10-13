"""Pytest tests for Codeforge authentication.

Student: Niranjan R Soorej
Roll No: 2024BCS0117

Tests:
    TC-PY-01 - Student-specific user registration
    TC-PY-02 - Wrong password is rejected (negative test)
"""

import uuid


ROLL_NO = "2024BCS0117"


def test_tc_py_01_register_student_specific_user(client):
    """TC-PY-01: A new student-specific user can register successfully."""

    unique_id = uuid.uuid4().hex[:8]

    username = f"niranjan_{ROLL_NO}_{unique_id}"
    email = f"niranjan_{ROLL_NO}_{unique_id}@example.com"
    password = f"SecurePass-{ROLL_NO}!"

    response = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
        },
    )

    # Registration should succeed.
    assert response.status_code == 201, response.text

    data = response.json()

    # Verify returned user information.
    assert data["username"] == username
    assert data["email"] == email
    assert "id" in data

    # Password information must never be returned.
    assert "password" not in data
    assert "password_hash" not in data


def test_tc_py_02_wrong_password_returns_generic_error(
    client,
    make_user,
):
    """TC-PY-02: Wrong password is rejected with a generic error.

    Negative test:
    A valid user's account is accessed using an intentionally
    incorrect password.
    """

    correct_password = f"CorrectPass-{ROLL_NO}!"
    wrong_password = f"WrongPass-{ROLL_NO}!"

    user, _, _ = make_user(password=correct_password)

    response = client.post(
        "/auth/login",
        json={
            "email": user["email"],
            "password": wrong_password,
        },
    )

    assert response.status_code == 401

    data = response.json()

    assert data["code"] == "invalid_credentials"

    detail = data["detail"].lower()

    assert "incorrect" in detail
    assert "email" in detail
    assert "password" in detail

    assert "access_token" not in data
    assert "refresh_token" not in data