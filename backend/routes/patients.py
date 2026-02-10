from flask import Blueprint, request, jsonify, g
from backend.middleware.auth_middleware import login_required, role_required
from backend.services import patient_service

patients_bp = Blueprint('patients', __name__)


def _enrich_patient(p):
    """Add computed full_name from first_name + last_name."""
    if not p:
        return p
    return {
        **p,
        'full_name': f"{p.get('first_name', '')} {p.get('last_name', '')}".strip(),
    }


@patients_bp.route('/')
@login_required
def list_patients():
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    result = patient_service.get_patients(search=search, page=page)
    result = {**result, 'data': [_enrich_patient(p) for p in result.get('data', [])]}
    return jsonify({'success': True, 'data': result, 'search': search})


@patients_bp.route('/<patient_id>')
@login_required
def detail(patient_id):
    try:
        patient = patient_service.get_patient(patient_id)
    except Exception:
        patient = None
    if not patient:
        return jsonify({'success': False, 'error': 'המטופל לא נמצא'}), 404

    patient = _enrich_patient(patient)

    medical_history = None
    if g.user.get('role') == 'doctor':
        medical_history = patient_service.get_patient_medical_history(patient_id)

    raw_appointments = patient_service.get_patient_appointments(patient_id)
    appointments = []
    for a in raw_appointments:
        s = a.get('services') or {}
        appointments.append({
            **{k: v for k, v in a.items() if k != 'services'},
            'service_name': s.get('name', '') if isinstance(s, dict) else '',
        })
    invoices = patient_service.get_patient_invoices(patient_id)

    return jsonify({
        'success': True,
        'data': {
            'patient': patient,
            'medical_history': medical_history,
            'appointments': appointments,
            'invoices': invoices,
        },
    })


@patients_bp.route('/', methods=['POST'])
@login_required
def create():
    data = request.get_json()
    patient = patient_service.create_patient(data)
    if patient:
        return jsonify({'success': True, 'data': patient})
    return jsonify({'success': False, 'error': 'שגיאה ביצירת מטופל'}), 400


@patients_bp.route('/<patient_id>', methods=['PUT'])
@login_required
def update(patient_id):
    data = request.get_json()
    patient = patient_service.update_patient(patient_id, data)
    if patient:
        return jsonify({'success': True, 'data': patient})
    return jsonify({'success': False, 'error': 'שגיאה בעדכון מטופל'}), 400


@patients_bp.route('/<patient_id>', methods=['DELETE'])
@login_required
def delete(patient_id):
    try:
        patient_service.delete_patient(patient_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@patients_bp.route('/<patient_id>/medical-history', methods=['PUT'])
@login_required
@role_required('doctor')
def update_medical(patient_id):
    data = request.get_json()
    result = patient_service.update_medical_history(patient_id, data)
    if result:
        return jsonify({'success': True, 'data': result})
    return jsonify({'success': False, 'error': 'שגיאה בעדכון היסטוריה רפואית'}), 400
