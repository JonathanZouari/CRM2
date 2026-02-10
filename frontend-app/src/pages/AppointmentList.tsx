import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { useToast } from '../components/Toast'
import Header from '../components/Header'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import type { Appointment, Patient, Service, ApiResponse } from '../types'

function formatDate(d: string) { return new Date(d).toLocaleDateString('he-IL') }

interface ListData {
  data: Appointment[]
  total: number
  page: number
  limit: number
  services: Service[]
  patients_list: Patient[]
}

export default function AppointmentList() {
  const [items, setItems] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Appointment | null>(null)
  const [form, setForm] = useState({ patient_id: '', service_id: '', appointment_date: '', status: 'scheduled', notes: '' })
  const { showToast } = useToast()
  const limit = 10

  const fetchData = () => {
    apiFetch<ApiResponse<ListData>>(`/api/appointments/?search=${search}&status=${statusFilter}&page=${page}`)
      .then((res) => {
        if (res.data) {
          setItems(res.data.data); setTotal(res.data.total)
          setPatients(res.data.patients_list); setServices(res.data.services)
        }
      })
  }

  useEffect(() => { fetchData() }, [page, search, statusFilter])

  const openCreate = () => { setEditItem(null); setForm({ patient_id: '', service_id: '', appointment_date: '', status: 'scheduled', notes: '' }); setModalOpen(true) }
  const openEdit = (a: Appointment) => { setEditItem(a); setForm({ patient_id: a.patient_id, service_id: a.service_id, appointment_date: a.appointment_date?.slice(0, 16) || '', status: a.status, notes: a.notes || '' }); setModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editItem) {
        await apiFetch(`/api/appointments/${editItem.id}`, { method: 'PUT', body: JSON.stringify(form) })
        showToast('תור עודכן', 'success')
      } else {
        await apiFetch('/api/appointments/', { method: 'POST', body: JSON.stringify(form) })
        showToast('תור נוצר', 'success')
      }
      setModalOpen(false); fetchData()
    } catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק תור זה?')) return
    try { await apiFetch(`/api/appointments/${id}`, { method: 'DELETE' }); showToast('נמחק', 'success'); fetchData() }
    catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  return (
    <>
      <Header title="תורים" actions={
        <div className="flex gap-3">
          <input type="text" placeholder="חיפוש..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">כל הסטטוסים</option>
            <option value="scheduled">מתוכנן</option>
            <option value="completed">הושלם</option>
            <option value="cancelled">בוטל</option>
            <option value="no_show">לא הגיע</option>
          </select>
          <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">add</span>תור חדש</button>
        </div>
      } />
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">מטופל</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">שירות</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">תאריך</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">סטטוס</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">פעולות</th>
            </tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-800">{a.patient_name || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{a.service_name || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{a.appointment_date ? formatDate(a.appointment_date) : '-'}</td>
                  <td className="px-6 py-4">{a.status}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-danger"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">לא נמצאו תורים</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'ערוך תור' : 'תור חדש'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
            <option value="">בחר מטופל</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
            <option value="">בחר שירות</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="datetime-local" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
            <option value="scheduled">מתוכנן</option><option value="completed">הושלם</option><option value="cancelled">בוטל</option><option value="no_show">לא הגיע</option>
          </select>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="הערות" rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
          <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">{editItem ? 'עדכן' : 'צור'}</button>
        </form>
      </Modal>
    </>
  )
}
