from flask import Blueprint, request, jsonify
from database import get_collection
import jwt
import bcrypt
import datetime
import os
from bson import ObjectId
from pymongo.errors import ConnectionFailure

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.environ.get('SECRET_KEY', 'student-analytics-secret-key-2024')
ALLOWED_EMAIL_DOMAIN = '@kristujayanti.com'
DEFAULT_DEV_EMAIL = 'someone@kristujayanti.com'
DEFAULT_DEV_PASSWORD = 'welcome123'
DEFAULT_DEV_NAME = 'Sample Faculty'
DEFAULT_DEV_ROLE = 'teacher'

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

def is_bcrypt_hash(password_value):
    if isinstance(password_value, bytes):
        return password_value.startswith((b'$2a$', b'$2b$', b'$2y$'))
    if isinstance(password_value, str):
        return password_value.startswith(('$2a$', '$2b$', '$2y$'))
    return False

def password_matches(plain_password, stored_password):
    if not stored_password:
        return False

    if is_bcrypt_hash(stored_password):
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), normalize_password_hash(stored_password))
        except ValueError:
            return False

    if isinstance(stored_password, bytes):
        try:
            return stored_password.decode('utf-8') == plain_password
        except UnicodeDecodeError:
            return False

    if isinstance(stored_password, str):
        return stored_password == plain_password

    return False

def upgrade_password_hash_if_needed(users, user, plain_password):
    stored_password = user.get('password', b'')
    if is_bcrypt_hash(stored_password):
        return

    users.update_one(
        {'_id': user['_id']},
        {
            '$set': {
                'password': bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()),
                'updated_at': datetime.datetime.utcnow()
            }
        }
    )

def ensure_default_user_exists(users):
    if users.count_documents({}, limit=1):
        return

    now = datetime.datetime.utcnow()
    users.insert_one({
        'email': DEFAULT_DEV_EMAIL,
        'name': DEFAULT_DEV_NAME,
        'role': DEFAULT_DEV_ROLE,
        'password': bcrypt.hashpw(DEFAULT_DEV_PASSWORD.encode('utf-8'), bcrypt.gensalt()),
        'isFirstLogin': True,
        'created_at': now,
        'updated_at': now
    })

def build_name_from_email(email):
    local_part = email.split('@', 1)[0].replace('.', ' ').replace('_', ' ').replace('-', ' ')
    words = [word for word in local_part.split() if word]
    return ' '.join(word.capitalize() for word in words) or DEFAULT_DEV_NAME

def provision_first_login_user(users, email, password):
    if password != DEFAULT_DEV_PASSWORD or not is_allowed_email(email):
        return None

    now = datetime.datetime.utcnow()
    user_doc = {
        'email': email,
        'name': build_name_from_email(email),
        'role': DEFAULT_DEV_ROLE,
        'password': bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()),
        'isFirstLogin': True,
        'created_at': now,
        'updated_at': now
    }
    users.insert_one(user_doc)
    return users.find_one({'email': email})

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

    try:
        users = get_collection('users')
    except ConnectionFailure:
        return jsonify({'error': 'Database connection failed. Make sure MongoDB is running and MONGO_URI is correct.'}), 503

    ensure_default_user_exists(users)
    user = users.find_one({'email': email})

    if not user:
        user = provision_first_login_user(users, email, password)
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

    if not password_matches(password, user.get('password', b'')):
        return jsonify({'error': 'Invalid credentials'}), 401

    upgrade_password_hash_if_needed(users, user, password)

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

    try:
        users = get_collection('users')
    except ConnectionFailure:
        return jsonify({'error': 'Database connection failed. Make sure MongoDB is running and MONGO_URI is correct.'}), 503

    user = users.find_one({'_id': ObjectId(payload['user_id'])})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not password_matches(current_password, user.get('password', b'')):
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
    except ConnectionFailure:
        return jsonify({'valid': False, 'error': 'Database connection failed'}), 503
    except:
        return jsonify({'valid': False}), 401
