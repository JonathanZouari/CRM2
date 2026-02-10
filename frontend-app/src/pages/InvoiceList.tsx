import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { useToast } from '../components/Toast'
import Header from '../components/Header'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import type { Invoice, Patient, Service, ApiResponse } from '../types'

function formatCurrency(n: number) { return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(n) }
function formatDate(d: string) { return new Date(d).toLocaleDateString('he-IL') }

interface ListData {
  data: Invoice[]
  total: number
  page: number
  limit: number
  patients_list: Patient[]
  services: Service[]
}

export default function InvoiceList() {
  const [items, setItems] = useState<Invoice[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Invoice | null>(null)
  const [form, setForm] = useState({ patient_id: '', service_id: '', amount: '', status: 'pending', issued_date: '' })
  const { showToast } = useToast()
  const limit = 10

  const fetchData = () => {
    apiFetch<ApiResponse<ListData>>(`/api/invoices/?search=${search}&status=${statusFilter}&page=${page}`)
      .then((res) => {
        if (res.data) {
          setItems(res.data.data); setTotal(res.data.total)
          setPatients(res.data.patients_list); setServices(res.data.services)
        }
      })
  }

  useEffect(() => { fetchData() }, [page, search, statusFilter])

  const openCreate = () => { setEditItem(null); setForm({ patient_id: '', service_id: '', amount: '', status: 'pending', issued_date: '' }); setModalOpen(true) }
  const openEdit = (inv: Invoice) => { setEditItem(inv); setForm({ patient_id: inv.patient_id, service_id: inv.service_id, amount: String(inv.amount), status: inv.status, issued_date: inv.issued_date || '' }); setModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { ...form, amount: parseFloat(form.amount) }
    try {
      if (editItem) {
        await apiFetch(`/api/invoices/${editItem.id}`, { method: 'PUT', body: JSON.stringify(body) })
        showToast('חשבונית עודכנה', 'success')
      } else {
        await apiFetch('/api/invoices/', { method: 'POST', body: JSON.stringify(body) })
        showToast('חשבונית נוצרה', 'success')
      }
      setModalOpen(false); fetchData()
    } catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  const markPaid = async (id: string) => {
    try { await apiFetch(`/api/invoices/${id}/pay`, { method: 'POST' }); showToast('סומן כשולם', 'success'); fetchData() }
    catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק חשבונית זו?')) return
    try { await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' }); showToast('נמחק', 'success'); fetchData() }
    catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', overdue: 'bg-red-100 text-red-800' }

  return (
    <>
      <Header title="חשבוניות" actions={
        <div className="flex gap-3">
          <input type="text" placeholder="חיפוש..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">הכל</option><option value="pending">ממתין</option><option value="paid">שולם</option><option value="overdue">באיחור</option>
          </select>
          <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">add</span>חשבונית חדשה</button>
        </div>
      } />
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">מטופל</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">סכום</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">תאריך</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">סטטוס</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">פעולות</th>
            </tr></thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-800">{inv.patient_name || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{formatCurrency(inv.amount)}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.issued_date ? formatDate(inv.issued_date) : '-'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[inv.status] || ''}`}>{inv.status}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {inv.status !== 'paid' && <button onClick={() => markPaid(inv.id)} className="text-gray-400 hover:text-success" title="סמן כשולם"><span className="material-symbols-outlined text-lg">check_circle</span></button>}
                      <button onClick={() => openEdit(inv)} className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => handleDelete(inv.id)} className="text-gray-400 hover:text-danger"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">לא נמצאו חשבוניות</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'ערוך חשבונית' : 'חשבונית חדשה'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
            <option value="">בחר מטופל</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
            <option value="">בחר שירות</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="סכום" required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
          <input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
          <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">{editItem ? 'עדכן' : 'צור'}</button>
        </form>
      </Modal>
    </>
  )
}
