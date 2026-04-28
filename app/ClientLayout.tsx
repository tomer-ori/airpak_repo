'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    const fetchAlerts = () =>
      fetch('/api/alerts').then(r => r.json())
        .then(data => setAlertCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {})
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    // direction: ltr on wrapper so flex-direction: row works normally (left→right)
    // Sidebar is last in DOM → appears on the RIGHT
    // Main content is first → appears on the LEFT
    <div style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', direction: 'ltr' }}>
      <main style={{ flex: 1, overflow: 'auto', direction: 'rtl', minWidth: 0 }}>
        {children}
      </main>
      <Sidebar alertCount={alertCount} />
    </div>
  )
}
