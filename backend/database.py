from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        configured_uri = os.environ.get('MONGO_URI')
        candidate_uris = [configured_uri] if configured_uri else [
            'mongodb://localhost:27017/student_analytics',
            'mongodb://mongo:27017/student_analytics'
        ]

        last_error = None
        for mongo_uri in candidate_uris:
            try:
                _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
                _client.admin.command('ping')
                _db = _client.get_default_database()
                break
            except ConnectionFailure as exc:
                last_error = exc
                _client = None

        if _db is None:
            raise ConnectionFailure(f'Unable to connect to MongoDB using: {candidate_uris}') from last_error
    return _db

def get_collection(name):
    return get_db()[name]
