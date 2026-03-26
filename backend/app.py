import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

# Load environment variables before importing route modules that read them at import time.
backend_dir = Path(__file__).resolve().parent
project_root_env = backend_dir.parent / '.env'
backend_env = backend_dir / '.env'

if project_root_env.exists():
    load_dotenv(project_root_env)
elif backend_env.exists():
    load_dotenv(backend_env)

from routes.students import students_bp
from routes.analytics import analytics_bp
from routes.reports import reports_bp
from routes.auth import auth_bp
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization']
    )

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=app.config['PORT'], debug=True)
