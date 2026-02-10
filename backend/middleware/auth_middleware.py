from functools import wraps
from flask import request, jsonify, g
from backend.middleware.jwt_middleware import decode_token


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'אסימון הזדהות חסר'}), 401

        token = auth_header[7:]
        payload = decode_token(token)
        if payload is None:
            return jsonify({'success': False, 'error': 'אסימון הזדהות לא תקין'}), 401

        g.user = payload
        return f(*args, **kwargs)
    return decorated


def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.user.get('role') != role:
                return jsonify({'success': False, 'error': 'אין לך הרשאה לפעולה זו'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
