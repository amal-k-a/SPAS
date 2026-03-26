import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'student-analytics-secret-key-2024')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://mongo:27017/student_analytics')
    PORT = int(os.environ.get('PORT', '5001'))
    JWT_EXPIRATION_HOURS = 24
    UPLOAD_FOLDER = '/tmp/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    SMTP_HOST = os.environ.get('SMTP_HOST', '')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', '')
    SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'
    EMAIL_DEBUG = os.environ.get('EMAIL_DEBUG', 'false').lower() == 'true'
