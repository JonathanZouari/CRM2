from flask import Blueprint, request, jsonify
from backend.middleware.auth_middleware import login_required
from backend.services import invoice_service, patient_service, catalog_service

invoices_bp = Blueprint('invoices', __name__)


def _flatten_invoice(inv):
    """Flatten nested patients join into flat patient_name field."""
    if not inv:
        return inv
    p = inv.get('patients') or {}
    return {
        **{k: v for k, v in inv.items() if k != 'patients'},
        'patient_name': f"{p.get('first_name', '')} {p.get('last_name', '')}".strip() if p else '',
    }


def _enrich_patient(p):
    if not p:
        return p
    return {
        **p,
        'full_name': f"{p.get('first_name', '')} {p.get('last_name', '')}".strip(),
    }


@invoices_bp.route('/')
@login_required
def list_invoices():
    search = request.args.get('search', '')
    status_filter = request.args.get('status', '')
    page = int(request.args.get('page', 1))
    result = invoice_service.get_invoices(
        search=search, status_filter=status_filter, page=page
    )
    result = {**result, 'data': [_flatten_invoice(inv) for inv in result.get('data', [])]}
    patients = [_enrich_patient(p) for p in patient_service.get_patients(limit=100)['data']]
    services = catalog_service.get_all_services()
    return jsonify({
        'success': True,
        'data': {
            **result,
            'patients_list': patients,
            'services': services,
        },
        'search': search,
        'status_filter': status_filter,
    })


@invoices_bp.route('/', methods=['POST'])
@login_required
def create():
    data = request.get_json()
    invoice = invoice_service.create_invoice(data)
    if invoice:
        return jsonify({'success': True, 'data': invoice})
    return jsonify({'success': False, 'error': 'שגיאה ביצירת חשבונית'}), 400


@invoices_bp.route('/<invoice_id>', methods=['PUT'])
@login_required
def update(invoice_id):
    data = request.get_json()
    invoice = invoice_service.update_invoice(invoice_id, data)
    if invoice:
        return jsonify({'success': True, 'data': invoice})
    return jsonify({'success': False, 'error': 'שגיאה בעדכון חשבונית'}), 400


@invoices_bp.route('/<invoice_id>/pay', methods=['POST'])
@login_required
def mark_paid(invoice_id):
    invoice = invoice_service.mark_as_paid(invoice_id)
    if invoice:
        return jsonify({'success': True, 'data': invoice})
    return jsonify({'success': False, 'error': 'שגיאה בסימון תשלום'}), 400


@invoices_bp.route('/<invoice_id>', methods=['DELETE'])
@login_required
def delete(invoice_id):
    try:
        invoice_service.delete_invoice(invoice_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400
