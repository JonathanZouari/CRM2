import jwt
from flask import current_app


def create_token(user_data):
    """Create a JWT token with user data as payload."""
    return jwt.encode(
        {
            'user_id': user_data['id'],
            'email': user_data['email'],
            'full_name': user_data['full_name'],
            'role': user_data['role'],
        },
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256',
    )


def decode_token(token):
    """Decode and validate a JWT token. Returns payload dict or None."""
    try:
        return jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256'],
        )
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
