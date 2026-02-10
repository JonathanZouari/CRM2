import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { useToast } from '../components/Toast'
import Header from '../components/Header'
import Modal from '../components/Modal'
import type { Task, ApiResponse } from '../types'

const columns = [
  { status: 'todo', label: 'לביצוע', color: 'border-t-gray-400' },
  { status: 'in_progress', label: 'בתהליך', color: 'border-t-primary' },
  { status: 'done', label: 'הושלם', color: 'border-t-success' },
]

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

interface TasksData {
  tasks: Record<string, Task[]>
  users: Array<{ id: string; full_name: string }>
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({})
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', status: 'todo' })
  const { showToast } = useToast()

  const fetchData = () => {
    apiFetch<ApiResponse<TasksData>>('/api/tasks/').then((res) => {
      if (res.data) { setTasks(res.data.tasks); setUsers(res.data.users) }
    })
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditItem(null); setForm({ title: '', description: '', priority: 'medium', assigned_to: '', status: 'todo' }); setModalOpen(true) }
  const openEdit = (t: Task) => { setEditItem(t); setForm({ title: t.title, description: t.description || '', priority: t.priority, assigned_to: t.assigned_to || '', status: t.status }); setModalOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editItem) {
        await apiFetch(`/api/tasks/${editItem.id}`, { method: 'PUT', body: JSON.stringify(form) })
        showToast('משימה עודכנה', 'success')
      } else {
        await apiFetch('/api/tasks/', { method: 'POST', body: JSON.stringify(form) })
        showToast('משימה נוצרה', 'success')
      }
      setModalOpen(false); fetchData()
    } catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  const moveTask = async (taskId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/tasks/${taskId}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus, position: 0 }) })
      fetchData()
    } catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק משימה זו?')) return
    try { await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }); showToast('נמחק', 'success'); fetchData() }
    catch (err) { showToast(err instanceof Error ? err.message : 'שגיאה', 'danger') }
  }

  return (
    <>
      <Header title="משימות" actions={
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">add</span>משימה חדשה
        </button>
      } />
      <div className="p-8">
        <div className="grid grid-cols-3 gap-6">
          {columns.map((col) => (
            <div key={col.status} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ${col.color}`}>
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">{col.label}</h3>
                <span className="text-xs text-gray-400">{(tasks[col.status] || []).length} משימות</span>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {(tasks[col.status] || []).map((task) => (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority] || ''}`}>{task.priority}</span>
                    </div>
                    {task.description && <p className="text-xs text-gray-500 mb-3">{task.description}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {col.status !== 'todo' && (
                          <button onClick={() => moveTask(task.id, col.status === 'done' ? 'in_progress' : 'todo')} className="text-gray-400 hover:text-primary" title="הזז שמאלה">
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                          </button>
                        )}
                        {col.status !== 'done' && (
                          <button onClick={() => moveTask(task.id, col.status === 'todo' ? 'in_progress' : 'done')} className="text-gray-400 hover:text-success" title="הזז ימינה">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(task)} className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined text-sm">edit</span></button>
                        <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-danger"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'ערוך משימה' : 'משימה חדשה'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="כותרת" required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="תיאור" rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
            <option value="low">נמוכה</option><option value="medium">בינונית</option><option value="high">גבוהה</option>
          </select>
          <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
            <option value="">לא מוקצה</option>{users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
            <option value="todo">לביצוע</option><option value="in_progress">בתהליך</option><option value="done">הושלם</option>
          </select>
          <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">{editItem ? 'עדכן' : 'צור'}</button>
        </form>
      </Modal>
    </>
  )
}
