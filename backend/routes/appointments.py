from flask import Blueprint, request, jsonify
from backend.middleware.auth_middleware import login_required
from backend.services import appointment_service, catalog_service, patient_service

appointments_bp = Blueprint('appointments', __name__)


def _flatten_appointment(a):
    """Flatten nested patients/services joins into flat fields."""
    if not a:
        return a
    p = a.get('patients') or {}
    s = a.get('services') or {}
    return {
        **{k: v for k, v in a.items() if k not in ('patients', 'services')},
        'patient_name': f"{p.get('first_name', '')} {p.get('last_name', '')}".strip() if p else '',
        'service_name': s.get('name', '') if isinstance(s, dict) else '',
    }


def _enrich_patient(p):
    if not p:
        return p
    return {
        **p,
        'full_name': f"{p.get('first_name', '')} {p.get('last_name', '')}".strip(),
    }


@appointments_bp.route('/')
@login_required
def list_appointments():
    search = request.args.get('search', '')
    status_filter = request.args.get('status', '')
    page = int(request.args.get('page', 1))
    result = appointment_service.get_appointments(
        search=search, status_filter=status_filter, page=page
    )
    result = {**result, 'data': [_flatten_appointment(a) for a in result.get('data', [])]}
    services = catalog_service.get_all_services()
    patients = [_enrich_patient(p) for p in patient_service.get_patients(limit=100)['data']]
    return jsonify({
        'success': True,
        'data': {
            **result,
            'services': services,
            'patients_list': patients,
        },
        'search': search,
        'status_filter': status_filter,
    })


@appointments_bp.route('/', methods=['POST'])
@login_required
def create():
    data = request.get_json()
    appointment = appointment_service.create_appointment(data)
    if appointment:
        return jsonify({'success': True, 'data': appointment})
    return jsonify({'success': False, 'error': 'שגיאה ביצירת תור'}), 400


@appointments_bp.route('/<appointment_id>', methods=['PUT'])
@login_required
def update(appointment_id):
    data = request.get_json()
    appointment = appointment_service.update_appointment(appointment_id, data)
    if appointment:
        return jsonify({'success': True, 'data': appointment})
    return jsonify({'success': False, 'error': 'שגיאה בעדכון תור'}), 400


@appointments_bp.route('/<appointment_id>', methods=['DELETE'])
@login_required
def delete(appointment_id):
    try:
        appointment_service.delete_appointment(appointment_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400
