import jwt
from flask import request, jsonify
from functools import wraps
from App.models import User
import os
from App import bcrypt

# Hash password
def generate_password_hash(plain_password):
    return bcrypt.generate_password_hash(plain_password).decode('utf-8')
SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            bearer = request.headers['Authorization']
            token = bearer.split()[1] if ' ' in bearer else bearer

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(data['sub'])
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    @token_required
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin access only!'}), 403
        return f(current_user, *args, **kwargs)

    return decorated
