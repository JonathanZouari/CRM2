import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, ApiResponse } from '../types'
import { apiFetch } from '../api/client'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isDoctor: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  )

  useEffect(() => {
    if (token && !user) {
      apiFetch<ApiResponse<User>>('/api/auth/me')
        .then((res) => {
          if (res.data) {
            setUser(res.data)
            localStorage.setItem('user', JSON.stringify(res.data))
          }
        })
        .catch(() => {
          setToken(null)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
    }
  }, [token, user])

  const login = async (email: string, password: string) => {
    const res = await apiFetch<ApiResponse<{ token: string; user: User }>>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    )
    if (res.data) {
      setToken(res.data.token)
      setUser(res.data.user as User)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isDoctor: user?.role === 'doctor' }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
