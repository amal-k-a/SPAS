import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'student-analytics-secret-key-2024')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://mongo:27017/student_analytics')
    PORT = int(os.environ.get('PORT', '5001'))
    JWT_EXPIRATION_HOURS = 24
    UPLOAD_FOLDER = '/tmp/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
