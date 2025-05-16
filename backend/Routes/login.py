# login.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from App.models import User ,Student # Model User dari Flask-SQLAlchemy
from App import bcrypt  # Inisialisasi Bcrypt dari __init__.py
from sqlalchemy import or_
# Blueprint untuk login
login_bp = Blueprint('login', __name__)

@login_bp.route('/login', methods=['POST'])
def login():
    # Ambil data dari request JSON
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Validasi input
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Cek apakah input adalah NIM (hanya angka)
    is_nim = username.isdigit()

    if is_nim:
        # Jika input adalah NIM, cari student berdasarkan NIM
        student = Student.query.filter(Student.nim == int(username)).first()
        if not student or not student.user:
            return jsonify({"error": "Invalid NIM or password"}), 401
        
        user = student.user
        if user.role != "student":
            return jsonify({"error": "Invalid credentials"}), 401
    else:
        # Jika input adalah username, cari user berdasarkan username
        user = User.query.filter(User.username == username).first()
        if not user or user.role != "admin":
            return jsonify({"error": "Invalid username or password"}), 401

    # Validasi password
    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    claims = {
        "username": user.username,
        "role": user.role
    }

    # Jika role adalah student, gunakan NIM sebagai identity
    if user.role == "student":
        identity = str(user.student.nim)
    else:
        identity = str(user.id)

    access_token = create_access_token(identity=identity, additional_claims=claims)
    return jsonify({
        "token": access_token,
        "role": user.role,
    }), 200
