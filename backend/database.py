from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        mongo_uri = os.environ.get('MONGO_URI', 'mongodb://mongo:27017/student_analytics')
        _client = MongoClient(mongo_uri)
        _db = _client.get_default_database()
    return _db

def get_collection(name):
    return get_db()[name]
