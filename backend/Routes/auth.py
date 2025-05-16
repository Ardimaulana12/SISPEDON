from flask import Blueprint, request, jsonify
from App.models import db, User, Student, Class
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import  bcrypt
from utils.auth import  generate_password_hash
# Blueprint untuk auth dengan nama yang benar sesuai registrasi di App/__init__.py
auth_bp_profile = Blueprint('auth_profile', __name__)

# Tambahkan blueprint kedua untuk kompatibilitas dengan app.py
auth_bp = Blueprint('auth', __name__)

@auth_bp_profile.route('/api/change-password', methods=['POST'])
@jwt_required()
def change_password():
    # Get user identity from JWT
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    # For student users, identity is the NIM
    # For admin users, identity is the user ID
    if role == "student":
        # Find student by NIM
        student = Student.query.filter_by(nim=identity).first()
        if not student:
            return jsonify({"message": "Student not found"}), 404
        user = student.user
    else:
        # Find user by ID
        user = User.query.get(identity)
    
    # Get request data
    data = request.json
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({"message": "Missing password fields"}), 400
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Verify old password
    if not bcrypt.checkpw(old_password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"message": "Incorrect old password"}), 401
    
    # Update password
    user.password = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({"message": "Password changed successfully"})

@auth_bp.route('/api/change-password', methods=['POST'])
@jwt_required()
def change_password_alt():
    # Get user identity from JWT
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    # For student users, identity is the NIM
    # For admin users, identity is the user ID
    if role == "student":
        # Find student by NIM
        student = Student.query.filter_by(nim=identity).first()
        if not student:
            return jsonify({"message": "Student not found"}), 404
        user = student.user
    else:
        # Find user by ID
        user = User.query.get(identity)
    
    # Get request data
    data = request.json
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({"message": "Missing password fields"}), 400
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Verify old password
    if not bcrypt.checkpw(old_password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"message": "Incorrect old password"}), 401
    
    # Update password
    user.password = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({"message": "Password changed successfully"})

# Endpoint profile di auth_bp_profile
@auth_bp_profile.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    # Get user identity from JWT
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    # For student users, identity is the NIM
    # For admin users, identity is the user ID
    if role == "student":
        # Find student by NIM
        student = Student.query.filter_by(nim=identity).first()
        if not student:
            return jsonify({"message": "Student not found"}), 404
        user = student.user
    else:
        # Find user by ID
        user = User.query.get(identity)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Prepare response data
    profile_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else None
    }
    
    # If user is a student, add student-specific data
    if user.role == "student":
        student = Student.query.filter_by(user_id=user.id).first()
        if student:
            profile_data["nim"] = student.nim
            profile_data["name"] = student.name
            profile_data["class_id"] = student.class_id
            
            # Get class name if available
            if student.class_id:
                class_obj = Class.query.get(student.class_id)
                if class_obj:
                    profile_data["class_name"] = class_obj.name
    
    return jsonify(profile_data)

# Duplikat endpoint profile di auth_bp untuk konsistensi
@auth_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile_alt():
    # Get user identity from JWT
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    # For student users, identity is the NIM
    # For admin users, identity is the user ID
    if role == "student":
        # Find student by NIM
        student = Student.query.filter_by(nim=identity).first()
        if not student:
            return jsonify({"message": "Student not found"}), 404
        user = student.user
    else:
        # Find user by ID
        user = User.query.get(identity)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Prepare response data
    profile_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else None
    }
    
    # If user is a student, add student-specific data
    if user.role == "student":
        student = Student.query.filter_by(user_id=user.id).first()
        if student:
            profile_data["nim"] = student.nim
            profile_data["name"] = student.name
            profile_data["class_id"] = student.class_id
            
            # Get class name if available
            if student.class_id:
                class_obj = Class.query.get(student.class_id)
                if class_obj:
                    profile_data["class_name"] = class_obj.name
    
    return jsonify(profile_data)
