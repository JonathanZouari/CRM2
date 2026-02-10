import os
from flask import Flask, jsonify
from flask_cors import CORS


def create_app():
    app = Flask(__name__)

    app.config.from_object('backend.config.Config')

    CORS(app, origins=[
        os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
    ], supports_credentials=True)

    from backend.routes import register_blueprints
    register_blueprints(app)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'error': 'לא נמצא'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'success': False, 'error': 'שגיאת שרת פנימית'}), 500

    return app
