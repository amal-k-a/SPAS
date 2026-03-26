from email.message import EmailMessage
from flask import Blueprint, request, jsonify
from database import get_collection
import bcrypt
import datetime
import jwt
import os
import random
import smtplib
from bson import ObjectId
from pymongo.errors import ConnectionFailure

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.environ.get('SECRET_KEY', 'student-analytics-secret-key-2024')
ALLOWED_EMAIL_DOMAIN = '@kristujayanti.com'
DEFAULT_DEV_ROLE = 'teacher'
VERIFICATION_TTL_MINUTES = int(os.environ.get('VERIFICATION_TTL_MINUTES', '10'))
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '').replace(' ', '')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', SMTP_USERNAME)
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'
EMAIL_DEBUG = os.environ.get('EMAIL_DEBUG', 'false').lower() == 'true'


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


def build_name_from_email(email):
    local_part = email.split('@', 1)[0].replace('.', ' ').replace('_', ' ').replace('-', ' ')
    words = [word for word in local_part.split() if word]
    return ' '.join(word.capitalize() for word in words) or 'Faculty User'


def generate_otp():
    return f'{random.randint(0, 999999):06d}'


def send_verification_email(email, otp):
    if not SMTP_HOST or not SMTP_FROM_EMAIL:
        if EMAIL_DEBUG:
            return True, 'Verification code generated in debug mode.'
        return False, 'Email delivery is not configured on the server.'

    message = EmailMessage()
    message['Subject'] = 'Student Analytics Email Verification'
    message['From'] = SMTP_FROM_EMAIL
    message['To'] = email
    message.set_content(
        f'Your Student Analytics verification code is {otp}. '
        f'It expires in {VERIFICATION_TTL_MINUTES} minutes.'
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        if SMTP_USE_TLS:
            server.starttls()
        if SMTP_USERNAME:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)

    return True, 'Verification code sent successfully.'


def get_users_collection():
    return get_collection('users')


def get_verifications_collection():
    return get_collection('email_verifications')


@auth_bp.route('/request-verification-code', methods=['POST', 'OPTIONS'])
def request_verification_code():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200

    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    if not is_allowed_email(email):
        return jsonify({'error': f'Only {ALLOWED_EMAIL_DOMAIN} accounts are allowed'}), 403

    try:
        users = get_users_collection()
        verifications = get_verifications_collection()
    except ConnectionFailure:
        return jsonify({'error': 'Database connection failed. Make sure MongoDB is running and MONGO_URI is correct.'}), 503

    existing_user = users.find_one({'email': email})
    if existing_user and not existing_user.get('isFirstLogin', False):
        return jsonify({'error': 'This account is already activated. Please log in with your password.'}), 409

    otp = generate_otp()
    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(minutes=VERIFICATION_TTL_MINUTES)

    verifications.update_one(
        {'email': email},
        {
            '$set': {
                'email': email,
                'otp': bcrypt.hashpw(otp.encode('utf-8'), bcrypt.gensalt()),
                'expiresAt': expires_at,
                'updatedAt': now
            },
            '$inc': {'attempts': 1},
            '$setOnInsert': {'createdAt': now}
        },
        upsert=True
    )

    try:
        sent, message = send_verification_email(email, otp)
    except Exception as exc:
        return jsonify({'error': f'Failed to send verification email. Please check SMTP settings. {str(exc)}'}), 500

    if not sent:
        return jsonify({'error': message}), 500

    response = {
        'message': 'Verification code sent to your email address.',
        'expiresInMinutes': VERIFICATION_TTL_MINUTES
    }
    if EMAIL_DEBUG:
        response['debugCode'] = otp
    return jsonify(response), 200


@auth_bp.route('/activate-account', methods=['POST', 'OPTIONS'])
def activate_account():
    if request.method == 'OPTIONS':
        return jsonify({'ok': True}), 200

    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()

    if not email or not code or not password:
        return jsonify({'error': 'Email, verification code, and password are required'}), 400

    if not is_allowed_email(email):
        return jsonify({'error': f'Only {ALLOWED_EMAIL_DOMAIN} accounts are allowed'}), 403

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400

    try:
        users = get_users_collection()
        verifications = get_verifications_collection()
    except ConnectionFailure:
        return jsonify({'error': 'Database connection failed. Make sure MongoDB is running and MONGO_URI is correct.'}), 503

    verification = verifications.find_one({'email': email})
    if not verification:
        return jsonify({'error': 'No verification request found for this email'}), 404

    if verification.get('expiresAt') and verification['expiresAt'] < datetime.datetime.utcnow():
        verifications.delete_one({'_id': verification['_id']})
        return jsonify({'error': 'Verification code expired. Please request a new one.'}), 410

    if not password_matches(code, verification.get('otp', b'')):
        return jsonify({'error': 'Invalid verification code'}), 401

    user = users.find_one({'email': email})
    now = datetime.datetime.utcnow()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    resolved_name = name or (user.get('name') if user else '') or build_name_from_email(email)

    if user:
        users.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'name': resolved_name,
                    'password': password_hash,
                    'role': user.get('role', DEFAULT_DEV_ROLE),
                    'isFirstLogin': False,
                    'updated_at': now
                }
            }
        )
        user = users.find_one({'_id': user['_id']})
    else:
        user_doc = {
            'email': email,
            'name': resolved_name,
            'role': DEFAULT_DEV_ROLE,
            'password': password_hash,
            'isFirstLogin': False,
            'created_at': now,
            'updated_at': now
        }
        inserted = users.insert_one(user_doc)
        user = users.find_one({'_id': inserted.inserted_id})

    verifications.delete_one({'_id': verification['_id']})

    token = generate_token(user['_id'], user.get('role', DEFAULT_DEV_ROLE))
    return jsonify({
        'token': token,
        'name': user.get('name', user['email']),
        'role': user.get('role', ''),
        'email': user['email'],
        'isFirstLogin': False
    }), 200


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
        users = get_users_collection()
    except ConnectionFailure:
        return jsonify({'error': 'Database connection failed. Make sure MongoDB is running and MONGO_URI is correct.'}), 503

    user = users.find_one({'email': email})
    if not user:
        return jsonify({'error': 'Account not found. Verify your email first to activate access.'}), 404

    if user.get('isFirstLogin', False):
        return jsonify({'error': 'This account is pending activation. Please complete email verification first.'}), 403

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
        users = get_users_collection()
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
        users = get_users_collection()
        user = users.find_one({'_id': ObjectId(payload['user_id'])})
        return jsonify({
            'valid': True,
            'role': payload['role'],
            'isFirstLogin': user.get('isFirstLogin', False) if user else False
        })
    except ConnectionFailure:
        return jsonify({'valid': False, 'error': 'Database connection failed'}), 503
    except Exception:
        return jsonify({'valid': False}), 401
