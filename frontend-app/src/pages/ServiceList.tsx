import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { useToast } from '../components/Toast'
import Header from '../components/Header'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import type { Service, ApiResponse, PaginatedData } from '../types'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(n)
}

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', duration_minutes: '' })
  const { showToast } = useToast()
  const limit = 10

  const fetchData = () => {
    apiFetch<ApiResponse<PaginatedData<Service>>>(`/api/services/?search=${search}&page=${page}`)
      .then((res) => { if (res.data) { setServices(res.data.data); setTotal(res.data.total) } })
  }

  useEffect(() => { fetchData() }, [page, search])

  const openCreate = () => { setEditItem(null); setForm({ name: '', description: '', price: '', duration_minutes: '' }); setModalOpen(true) }
  const openEdit = (s: Service) => { setEditItem(s); setForm({ name: s.name, description: s.description || '', price: String(s.price), duration_minutes: String(s.duration_minutes) }); setModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { ...form, price: parseFloat(form.price), duration_minutes: parseInt(form.duration_minutes) }
    try {
      if (editItem) {
        await apiFetch(`/api/services/${editItem.id}`, { method: 'PUT', body: JSON.stringify(body) })
        showToast('שירות עודכן', 'success')
      } else {
        await apiFetch('/api/services/', { method: 'POST', body: JSON.stringify(body) })
        showToast('שירות נוצר', 'success')
      }
      setModalOpen(false); fetchData()
    } catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`האם למחוק את "${name}"?`)) return
    try { await apiFetch(`/api/services/${id}`, { method: 'DELETE' }); showToast('נמחק', 'success'); fetchData() }
    catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  return (
    <>
      <Header title="שירותים" actions={
        <div className="flex gap-3">
          <input type="text" placeholder="חיפוש..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">add</span>הוסף שירות</button>
        </div>
      } />
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">שם</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">מחיר</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">משך (דק׳)</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                  <td className="px-6 py-4 text-gray-600">{formatCurrency(s.price)}</td>
                  <td className="px-6 py-4 text-gray-600">{s.duration_minutes}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button onClick={() => handleDelete(s.id, s.name)} className="text-gray-400 hover:text-danger"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">לא נמצאו שירותים</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'ערוך שירות' : 'שירות חדש'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="שם שירות" required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="תיאור" rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="מחיר" required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} placeholder="משך בדקות" required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">{editItem ? 'עדכן' : 'צור'}</button>
        </form>
      </Modal>
    </>
  )
}
