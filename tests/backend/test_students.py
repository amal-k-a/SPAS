from types import SimpleNamespace

import jwt

import routes.students as students_routes
import utils.auth_middleware as auth_middleware


def make_token(user_id='owner-1', role='teacher'):
    return jwt.encode(
        {'user_id': user_id, 'role': role},
        auth_middleware.SECRET_KEY,
        algorithm='HS256'
    )


class FakeStudentsCollection:
    def __init__(self):
        self.students = []

    def find_one(self, query):
        for student in self.students:
            if all(student.get(key) == value for key, value in query.items()):
                return dict(student)
        return None

    def find(self, query):
        results = []
        for student in self.students:
            matches = True
            for key, value in query.items():
                if key == '$or':
                    continue
                if student.get(key) != value:
                    matches = False
                    break
            if matches:
                results.append(dict(student))
        return results

    def insert_one(self, student):
        student = dict(student)
        student['_id'] = 'student-1'
        self.students.append(student)
        return SimpleNamespace(inserted_id='student-1')


def test_get_students_requires_authentication(client):
    response = client.get('/api/students/')

    assert response.status_code == 401
    assert response.get_json()['error'] == 'Token missing'


def test_create_student_returns_created_record(monkeypatch, client):
    collection = FakeStudentsCollection()
    monkeypatch.setattr(students_routes, 'get_collection', lambda _name: collection)

    response = client.post(
        '/api/students/',
        headers={'Authorization': f'Bearer {make_token()}'},
        json={
            'studentId': 'STU001',
            'name': 'Alice',
            'marks': {'math': 92, 'science': 88},
            'attendance': 95,
            'remarks': 'Excellent work'
        }
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload['studentId'] == 'STU001'
    assert payload['ownerId'] == 'owner-1'


def test_get_students_includes_status_and_average(monkeypatch, client):
    collection = FakeStudentsCollection()
    collection.students.append(
        {
            '_id': 'student-1',
            'studentId': 'STU001',
            'name': 'Alice',
            'marks': {'math': 80, 'science': 70},
            'attendance': 90,
            'remarks': '',
            'ownerId': 'owner-1'
        }
    )
    monkeypatch.setattr(students_routes, 'get_collection', lambda _name: collection)

    response = client.get(
        '/api/students/',
        headers={'Authorization': f'Bearer {make_token()}'}
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload[0]['average'] == 75.0
    assert payload[0]['status'] == 'Excellent'
