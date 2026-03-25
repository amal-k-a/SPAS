import argparse
import datetime
import os

import bcrypt
from pymongo import MongoClient

ALLOWED_EMAIL_DOMAIN = '@kristujayanti.com'


def get_db():
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/student_analytics')
    client = MongoClient(mongo_uri)
    return client.get_default_database()


def main():
    parser = argparse.ArgumentParser(description='Create or update a faculty user for Student Analytics')
    parser.add_argument('--email', required=True, help='Faculty email address')
    parser.add_argument('--name', required=True, help='Display name')
    parser.add_argument('--role', required=True, choices=['admin', 'teacher'], help='User role')
    parser.add_argument('--password', default='welcome123', help='Initial password')
    parser.add_argument('--first-login', action='store_true', help='Force password change on next login')
    args = parser.parse_args()

    email = args.email.strip().lower()
    if not email.endswith(ALLOWED_EMAIL_DOMAIN):
        raise SystemExit(f'Email must end with {ALLOWED_EMAIL_DOMAIN}')

    db = get_db()
    users = db['users']
    hashed_password = bcrypt.hashpw(args.password.encode('utf-8'), bcrypt.gensalt())
    now = datetime.datetime.utcnow()

    result = users.update_one(
        {'email': email},
        {
            '$set': {
                'email': email,
                'name': args.name,
                'role': args.role,
                'password': hashed_password,
                'isFirstLogin': args.first_login,
                'updated_at': now
            },
            '$setOnInsert': {
                'created_at': now
            }
        },
        upsert=True
    )

    action = 'created' if result.upserted_id else 'updated'
    print(f'User {action}: {email}')
    print(f'Role: {args.role}')
    print(f'isFirstLogin: {args.first_login}')


if __name__ == '__main__':
    main()
