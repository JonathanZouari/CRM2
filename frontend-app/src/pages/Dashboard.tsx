import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Header from '../components/Header'
import type { ApiResponse, DashboardKPIs } from '../types'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(n)
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const { isDoctor } = useAuth()

  useEffect(() => {
    apiFetch<ApiResponse<DashboardKPIs>>('/api/dashboard/kpis').then((res) => {
      if (res.data) setKpis(res.data)
    })
  }, [])

  const cards = kpis
    ? [
        { label: 'סה״כ מטופלים', value: kpis.total_patients, icon: 'group', color: 'text-primary' },
        { label: 'תורים החודש', value: kpis.monthly_appointments, icon: 'calendar_month', color: 'text-success' },
        { label: 'הכנסות החודש', value: formatCurrency(kpis.monthly_revenue), icon: 'payments', color: 'text-warning' },
        { label: 'תשלומים ממתינים', value: kpis.pending_count, icon: 'pending_actions', color: 'text-danger' },
      ]
    : []

  return (
    <>
      <Header title="דשבורד" subtitle="סקירה כללית של המרפאה" />
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className={`material-symbols-outlined text-3xl ${card.color}`}>{card.icon}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {isDoctor && kpis && kpis.churn_patients.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">מטופלים בסיכון נטישה</h3>
            <div className="space-y-3">
              {kpis.churn_patients.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{p.patient_name}</span>
                  <span className={`text-sm font-medium ${p.score > 0.7 ? 'text-danger' : p.score > 0.4 ? 'text-warning' : 'text-success'}`}>
                    {Math.round(p.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
