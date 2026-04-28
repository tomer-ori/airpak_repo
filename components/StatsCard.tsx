import { ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  sub?: string
  icon: ReactNode
  gradient: string
  trend?: { value: number; label: string }
}

export default function StatsCard({ title, value, sub, icon, gradient, trend }: Props) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      border: '1px solid #e8edf5',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
      padding: '22px 24px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.06)'
      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)'
      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
    }}
    >
      {/* Accent stripe */}
      <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 3, background: gradient, borderRadius: '16px 16px 0 0' }} />

      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{ color: 'white' }}>{icon}</div>
      </div>

      <div style={{ color: '#6b7a99', fontSize: 13, fontWeight: 500, marginBottom: 6, letterSpacing: '0.01em' }}>
        {title}
      </div>
      <div style={{ color: '#0f1f3d', fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: '#9baabe', fontSize: 12, fontWeight: 400, marginTop: 6 }}>
          {sub}
        </div>
      )}
      {trend && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: trend.value >= 0 ? '#f0fdf4' : '#fff1f2',
            color: trend.value >= 0 ? '#15803d' : '#e11d48',
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          }}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span style={{ color: '#9baabe', fontSize: 11 }}>{trend.label}</span>
        </div>
      )}
    </div>
  )
}
