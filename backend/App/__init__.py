#_init_.py
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_migrate import Migrate
from .config import Config
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta
db = SQLAlchemy()
mail = Mail()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret_key')
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    # Batas waktu 1 hari
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)  
    # Inisialisasi ekstensi
    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
     # Middleware untuk CORS
    @app.after_request
    def add_cors_headers(response):
        # remove while production because in production using nginx
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        # for ports reverse
        # response.headers["Access-Control-Allow-Origin"] = "https://dg74q9t7-5173.asse.devtunnels.ms"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # Registrasi blueprint
    from Routes.questions import questions_bp
    from Routes.login import login_bp
    from Routes.lecturer import lecturer_bp
    from Routes.validate import auth_bp_token
    from Routes.auth import auth_bp_profile, auth_bp
    from Routes.admin import student_bp
    from Routes.teaching import teaching_bp
    from Routes.class_routes import class_bp
    from Routes.evaluation_history import evaluation_history_bp
    from Routes.leaderboard import leaderboard_bp
    app.register_blueprint(login_bp)
    app.register_blueprint(questions_bp)
    app.register_blueprint(lecturer_bp)
    app.register_blueprint(auth_bp_token)
    app.register_blueprint(auth_bp_profile)
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(teaching_bp)
    app.register_blueprint(class_bp)
    app.register_blueprint(evaluation_history_bp)
    app.register_blueprint(leaderboard_bp)
    # Serve lecturer photo uploads

    @app.route('/uploads/lecturers/<filename>')
    def serve_lecturer_photo(filename):
        return send_from_directory('/app/backend/uploads/lecturers', filename)
    # from . import models
    return app
