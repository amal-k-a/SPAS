from types import SimpleNamespace

import bcrypt

import routes.auth as auth_routes


class FakeUsersCollection:
    def __init__(self, users):
        self.users = users
        self.updated = []

    def find_one(self, query):
        email = query.get('email')
        for user in self.users:
            if user.get('email') == email:
                return user
        return None

    def update_one(self, query, update, upsert=False):
        self.updated.append((query, update, upsert))
        return SimpleNamespace(matched_count=1)


def test_login_rejects_missing_credentials(client):
    response = client.post('/api/auth/login', json={})

    assert response.status_code == 400
    assert response.get_json()['error'] == 'Email and password required'


def test_request_verification_code_rejects_non_college_email(client):
    response = client.post(
        '/api/auth/request-verification-code',
        json={'email': 'student@gmail.com'}
    )

    assert response.status_code == 403
    assert 'kristujayanti.com' in response.get_json()['error']


def test_login_accepts_valid_user(monkeypatch, client):
    hashed_password = bcrypt.hashpw(b'Password123', bcrypt.gensalt())
    users = FakeUsersCollection([
        {
            '_id': 'user-1',
            'email': 'faculty@kristujayanti.com',
            'password': hashed_password,
            'role': 'teacher',
            'name': 'Faculty User',
            'isFirstLogin': False
        }
    ])

    monkeypatch.setattr(auth_routes, 'get_users_collection', lambda: users)

    response = client.post(
        '/api/auth/login',
        json={'email': 'faculty@kristujayanti.com', 'password': 'Password123'}
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['email'] == 'faculty@kristujayanti.com'
    assert payload['role'] == 'teacher'
    assert 'token' in payload
