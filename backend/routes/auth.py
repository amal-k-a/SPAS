from flask import Blueprint, request, jsonify
from database import get_collection
import jwt
import bcrypt
import datetime
import os
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.environ.get('SECRET_KEY', 'student-analytics-secret-key-2024')
ALLOWED_EMAIL_DOMAIN = '@kristujayanti.com'

def generate_token(user_id, role):
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def is_allowed_email(email):
    return email.endswith(ALLOWED_EMAIL_DOMAIN)

def normalize_password_hash(password_hash):
    if isinstance(password_hash, str):
        return password_hash.encode('utf-8')
    return password_hash

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200

    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    if not is_allowed_email(email):
        return jsonify({'error': f'Only {ALLOWED_EMAIL_DOMAIN} accounts are allowed'}), 403

    users = get_collection('users')
    user = users.find_one({'email': email})

    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    stored_hash = normalize_password_hash(user.get('password', b''))
    if not stored_hash or not bcrypt.checkpw(password.encode('utf-8'), stored_hash):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = generate_token(user['_id'], user['role'])
    return jsonify({
        'token': token,
        'name': user.get('name', user['email']),
        'role': user.get('role', ''),
        'email': user['email'],
        'isFirstLogin': user.get('isFirstLogin', False)
    })

@auth_bp.route('/change-password', methods=['POST', 'OPTIONS'])
def change_password():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200

    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'Token missing'}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

    data = request.get_json() or {}
    current_password = data.get('currentPassword', '')
    new_password = data.get('newPassword', '')

    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password are required'}), 400

    if len(new_password) < 8:
        return jsonify({'error': 'New password must be at least 8 characters long'}), 400

    if current_password == new_password:
        return jsonify({'error': 'New password must be different from the current password'}), 400

    users = get_collection('users')
    user = users.find_one({'_id': ObjectId(payload['user_id'])})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    stored_hash = normalize_password_hash(user.get('password', b''))
    if not stored_hash or not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash):
        return jsonify({'error': 'Current password is incorrect'}), 401

    new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    users.update_one(
        {'_id': user['_id']},
        {'$set': {'password': new_hash, 'isFirstLogin': False, 'updated_at': datetime.datetime.utcnow()}}
    )

    refreshed_user = users.find_one({'_id': user['_id']})
    refreshed_token = generate_token(refreshed_user['_id'], refreshed_user.get('role', ''))
    return jsonify({
        'message': 'Password updated successfully',
        'token': refreshed_token,
        'name': refreshed_user.get('name', refreshed_user['email']),
        'role': refreshed_user.get('role', ''),
        'email': refreshed_user['email'],
        'isFirstLogin': False
    })

@auth_bp.route('/verify', methods=['GET'])
def verify():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        users = get_collection('users')
        user = users.find_one({'_id': ObjectId(payload['user_id'])})
        return jsonify({
            'valid': True,
            'role': payload['role'],
            'isFirstLogin': user.get('isFirstLogin', False) if user else False
        })
    except:
        return jsonify({'valid': False}), 401
