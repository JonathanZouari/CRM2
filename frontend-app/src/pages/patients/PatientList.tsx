import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import { useToast } from '../../components/Toast'
import Header from '../../components/Header'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import type { Patient, ApiResponse, PaginatedData } from '../../types'

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editPatient, setEditPatient] = useState<Patient | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', date_of_birth: '', gender: 'male', address: '' })
  const { showToast } = useToast()
  const limit = 10

  const fetchPatients = () => {
    apiFetch<ApiResponse<PaginatedData<Patient>>>(`/api/patients/?search=${search}&page=${page}`)
      .then((res) => {
        if (res.data) {
          setPatients(res.data.data)
          setTotal(res.data.total)
        }
      })
  }

  useEffect(() => { fetchPatients() }, [page, search])

  const openCreate = () => {
    setEditPatient(null)
    setForm({ first_name: '', last_name: '', phone: '', email: '', date_of_birth: '', gender: 'male', address: '' })
    setModalOpen(true)
  }

  const openEdit = (p: Patient) => {
    setEditPatient(p)
    setForm({ first_name: p.first_name || '', last_name: p.last_name || '', phone: p.phone, email: p.email, date_of_birth: p.date_of_birth || '', gender: p.gender || 'male', address: p.address || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editPatient) {
        await apiFetch(`/api/patients/${editPatient.id}`, { method: 'PUT', body: JSON.stringify(form) })
        showToast('מטופל עודכן בהצלחה', 'success')
      } else {
        await apiFetch('/api/patients/', { method: 'POST', body: JSON.stringify(form) })
        showToast('מטופל נוצר בהצלחה', 'success')
      }
      setModalOpen(false)
      fetchPatients()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'שגיאה', 'danger')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`האם למחוק את "${name}"?`)) return
    try {
      await apiFetch(`/api/patients/${id}`, { method: 'DELETE' })
      showToast('נמחק בהצלחה', 'success')
      fetchPatients()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'שגיאה', 'danger')
    }
  }

  return (
    <>
      <Header
        title="מטופלים"
        actions={
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">add</span>
              הוסף מטופל
            </button>
          </div>
        }
      />
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">שם מלא</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">טלפון</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">אימייל</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <Link to={`/patients/${p.id}`} className="text-primary hover:underline font-medium">{p.full_name}</Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{p.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-primary">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(p.id, p.full_name)} className="text-gray-400 hover:text-danger">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">לא נמצאו מטופלים</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editPatient ? 'ערוך מטופל' : 'מטופל חדש'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="שם פרטי" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="שם משפחה" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="טלפון" required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="אימייל"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} placeholder="תאריך לידה"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
          </select>
          <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="כתובת"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
            {editPatient ? 'עדכן' : 'צור'}
          </button>
        </form>
      </Modal>
    </>
  )
}
