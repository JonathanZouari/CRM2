from flask import Blueprint, request, jsonify, g
from backend.services.auth_service import authenticate_user
from backend.middleware.jwt_middleware import create_token
from backend.middleware.auth_middleware import login_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'יש לשלוח נתונים בפורמט JSON'}), 400

    email = (data.get('email') or '').strip()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'success': False, 'error': 'יש למלא את כל השדות'}), 400

    user = authenticate_user(email, password)
    if user is None:
        return jsonify({'success': False, 'error': 'אימייל או סיסמה שגויים'}), 401

    token = create_token(user)
    return jsonify({
        'success': True,
        'data': {
            'token': token,
            'user': user,
        },
    })


@auth_bp.route('/me')
@login_required
def me():
    return jsonify({'success': True, 'data': g.user})
