from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp_token = Blueprint('validate-token', __name__)

@auth_bp_token.route("/validate-token", methods=["GET"])
@jwt_required()
def validate_token():
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role", "unknown")
    return jsonify({
        "valid": True,
        "user_id": identity,
        "role": role
    }), 200
