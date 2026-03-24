from flask import Blueprint, request, jsonify
from database import get_collection
import jwt
import bcrypt
import datetime
import os

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.environ.get('SECRET_KEY', 'student-analytics-secret-key-2024')

def generate_token(user_id, role):
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    users = get_collection('users')
    user = users.find_one({'email': email})

    if not user:
        # Auto-create demo users on first login
        if email in ['teacher@school.com', 'admin@school.com']:
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            role = 'admin' if 'admin' in email else 'teacher'
            result = users.insert_one({
                'email': email,
                'password': hashed,
                'name': 'Admin User' if role == 'admin' else 'Teacher User',
                'role': role,
                'created_at': datetime.datetime.utcnow()
            })
            token = generate_token(result.inserted_id, role)
            return jsonify({'token': token, 'name': 'Admin User' if role == 'admin' else 'Teacher User', 'role': role})
        return jsonify({'error': 'Invalid credentials'}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = generate_token(user['_id'], user['role'])
    return jsonify({'token': token, 'name': user['name'], 'role': user['role']})

@auth_bp.route('/verify', methods=['GET'])
def verify():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify({'valid': True, 'role': payload['role']})
    except:
        return jsonify({'valid': False}), 401
