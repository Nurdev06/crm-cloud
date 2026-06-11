import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, MailOpen, AlertTriangle, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'

interface NotificationItem {
  id: number
  type: 'order' | 'delivery' | 'system' | 'security'
  title: string
  message: string
  created_at: string
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      type: 'order',
      title: 'New Wholesale Order Booked',
      message: 'Retail Fashion Ltd purchased 500 Heavy Cotton Hoodies (ORD-00003). Review credit allocation.',
      created_at: '2026-06-04T12:00:00Z',
      read: false,
    },
    {
      id: 2,
      type: 'delivery',
      title: 'Shipment DEL-00002 Dispatched',
      message: 'Driver John Miller departed from Central Hub to East Logistics Center.',
      created_at: '2026-06-04T09:45:00Z',
      read: false,
    },
    {
      id: 3,
      type: 'security',
      title: 'Successful Role Delegation',
      message: 'Super Administrator delegated "finance_manager" role permissions to user profile finance@retakecrm.com.',
      created_at: '2026-06-03T18:30:00Z',
      read: true,
    },
    {
      id: 4,
      type: 'system',
      title: 'Cloud Backup Complete',
      message: 'Amazon RDS database cluster successfully snapshot to Amazon S3 bucket (Region us-east-1).',
      created_at: '2026-06-03T01:00:00Z',
      read: true,
    }
  ])

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const handleMarkRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag size={16} style={{ color: '#10b981' }} />
      case 'delivery': return <Truck size={16} style={{ color: '#3b82f6' }} />
      case 'security': return <ShieldCheck size={16} style={{ color: '#ec4899' }} />
      default: return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Message Center</h1>
          <p className="section-subtitle">
            {unreadCount} unread system notifications
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', gap: 6 }} onClick={handleMarkAllRead}>
          <MailOpen size={16} /> Mark all read
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell />
            <h3>No notifications</h3>
            <p>Your Inbox is empty and clear</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '20px 24px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: notif.read ? 'none' : 'rgba(59, 130, 246, 0.04)',
                }}
              >
                <div style={{
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border))',
                  padding: 10,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}>
                  {getIcon(notif.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: notif.read ? 'hsl(var(--text-secondary))' : 'hsl(var(--text-primary))' }}>
                      {notif.title}
                    </h3>
                    <span style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'hsl(var(--text-secondary))', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #3b82f6', color: '#3b82f6' }}
                    onClick={() => handleMarkRead(notif.id)}>
                    Mark Read
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
