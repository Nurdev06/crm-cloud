import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInHours } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'UZS'): string {
  if (currency === 'UZS') {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m'
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—'
  return format(new Date(date), fmt)
}

export function formatRelative(date: string | Date): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#10b981', '#14b8a6', '#f59e0b', '#ef4444',
    '#0ea5e9', '#84cc16',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function truncate(text: string, max = 50): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

export function getSlaStatus(slaDueAt: string): 'ok' | 'warning' | 'breach' {
  const hours = differenceInHours(new Date(slaDueAt), new Date())
  if (hours < 0) return 'breach'
  if (hours < 2) return 'warning'
  return 'ok'
}

export const ORDER_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'badge-yellow' },
  approved: { label: 'Approved', badge: 'badge-blue' },
  packed: { label: 'Packed', badge: 'badge-purple' },
  shipped: { label: 'Shipped', badge: 'badge-teal' },
  delivered: { label: 'Delivered', badge: 'badge-green' },
  cancelled: { label: 'Cancelled', badge: 'badge-red' },
  returned: { label: 'Returned', badge: 'badge-orange' },
}

export const LEAD_STAGE_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  new: { label: 'New', badge: 'badge-blue', color: '#3b82f6' },
  contacted: { label: 'Contacted', badge: 'badge-purple', color: '#8b5cf6' },
  qualified: { label: 'Qualified', badge: 'badge-teal', color: '#14b8a6' },
  proposal_sent: { label: 'Proposal Sent', badge: 'badge-orange', color: '#f59e0b' },
  negotiation: { label: 'Negotiation', badge: 'badge-yellow', color: '#eab308' },
  won: { label: 'Won', badge: 'badge-green', color: '#10b981' },
  lost: { label: 'Lost', badge: 'badge-red', color: '#ef4444' },
}

export const TICKET_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'badge-blue' },
  in_progress: { label: 'In Progress', badge: 'badge-yellow' },
  waiting: { label: 'Waiting', badge: 'badge-orange' },
  resolved: { label: 'Resolved', badge: 'badge-green' },
  closed: { label: 'Closed', badge: 'badge-gray' },
}

export const PRIORITY_CONFIG: Record<string, { label: string; badge: string }> = {
  low: { label: 'Low', badge: 'badge-gray' },
  medium: { label: 'Medium', badge: 'badge-blue' },
  high: { label: 'High', badge: 'badge-yellow' },
  critical: { label: 'Critical', badge: 'badge-red' },
}

export const SEGMENT_CONFIG: Record<string, { label: string; badge: string }> = {
  vip: { label: 'VIP', badge: 'badge-purple' },
  wholesale: { label: 'Wholesale', badge: 'badge-blue' },
  regular: { label: 'Regular', badge: 'badge-teal' },
  retail: { label: 'Retail', badge: 'badge-green' },
  new: { label: 'New', badge: 'badge-yellow' },
  inactive: { label: 'Inactive', badge: 'badge-gray' },
}

export const ROLE_CONFIG: Record<string, { label: string; badge: string }> = {
  super_admin: { label: 'Super Admin', badge: 'badge-red' },
  sales_manager: { label: 'Sales Manager', badge: 'badge-purple' },
  sales_rep: { label: 'Sales Rep', badge: 'badge-blue' },
  warehouse_manager: { label: 'Warehouse Manager', badge: 'badge-teal' },
  logistics_manager: { label: 'Logistics Manager', badge: 'badge-orange' },
  customer_support: { label: 'Support', badge: 'badge-green' },
  finance_manager: { label: 'Finance Manager', badge: 'badge-yellow' },
}
