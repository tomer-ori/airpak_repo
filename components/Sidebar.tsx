'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Bell, BarChart3, Settings } from 'lucide-react'

const NAV = [
  { href: '/',           label: 'לוח בקרה',    icon: LayoutDashboard },
  { href: '/orders',     label: 'הזמנות',       icon: ShoppingCart },
  { href: '/alerts',     label: 'התראות',        icon: Bell },
  { href: '/statistics', label: 'סטטיסטיקות',   icon: BarChart3 },
  { href: '/settings',   label: 'הגדרות',        icon: Settings },
]

export default function Sidebar({ alertCount = 0 }: { alertCount?: number }) {
  const path = usePathname()

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #030e30 0%, #061a52 60%, #0a2878 100%)',
      boxShadow: '4px 0 32px rgba(3,14,48,0.25)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>

      {/* Logo */}
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #2d6aff 0%, #5c8cff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(45,106,255,0.4)',
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" fill="white" fillOpacity="0.9"/>
              <path d="M16 7V5c0-1.1-.9-2-2-2h-4C8.9 3 8 3.9 8 5v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 12v4M10 14h4" stroke="rgba(45,106,255,1)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', lineHeight: 1 }}>
              AirPak
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 400, marginTop: 3 }}>
              ניהול הזמנות
            </div>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding: '20px 24px 8px' }}>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          תפריט ראשי
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 12, marginBottom: 2,
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
              transition: 'all 0.15s ease',
              background: active ? 'linear-gradient(135deg, rgba(45,106,255,0.9) 0%, rgba(45,106,255,0.7) 100%)' : 'transparent',
              color: active ? 'white' : 'rgba(255,255,255,0.5)',
              boxShadow: active ? '0 4px 16px rgba(45,106,255,0.3)' : 'none',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'
              }
            }}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {href === '/alerts' && alertCount > 0 && (
                <span style={{
                  background: '#f43f5e', color: 'white',
                  fontSize: 11, fontWeight: 800,
                  minWidth: 20, height: 20, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 6px', boxShadow: '0 2px 8px rgba(244,63,94,0.5)',
                }}>
                  {alertCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16 }}>🏭</span>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 }}>AirPak בע"מ</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>© 2026</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
