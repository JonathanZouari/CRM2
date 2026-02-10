def register_blueprints(app):
    from backend.routes.health import health_bp
    from backend.routes.auth import auth_bp
    from backend.routes.dashboard import dashboard_bp
    from backend.routes.patients import patients_bp
    from backend.routes.services import services_bp
    from backend.routes.appointments import appointments_bp
    from backend.routes.invoices import invoices_bp
    from backend.routes.tasks import tasks_bp
    from backend.routes.chat import chat_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(services_bp, url_prefix='/api/services')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(invoices_bp, url_prefix='/api/invoices')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
