import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, ShoppingBag, Palette, Ruler } from 'lucide-react'
import { productService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = ['T-Shirts', 'Hoodies', 'Jackets', 'Jeans', 'Dresses', 'Accessories']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLORS = ['Black', 'White', 'Navy', 'Grey', 'Red', 'Green']

function ProductModal({
  open, onClose, onSave
}: { open: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    sku: '', name: '', category: 'T-Shirts', size: 'M',
    color: 'Black', wholesale_price: 0, retail_price: 0,
    total_stock: 0, min_stock_alert: 10, description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  if (!open) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Add New Product SKU</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>SKU Code *</label>
              <input className="input" required value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. W-HD-BLK-009" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Product Name *</label>
              <input className="input" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Premium Cotton Hoodie" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Size</label>
              <select className="input" value={form.size}
                onChange={e => setForm({ ...form, size: e.target.value })}>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Color</label>
              <select className="input" value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}>
                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Wholesale Price ($) *</label>
              <input className="input" type="number" required value={form.wholesale_price}
                onChange={e => setForm({ ...form, wholesale_price: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Retail Price ($) *</label>
              <input className="input" type="number" required value={form.retail_price}
                onChange={e => setForm({ ...form, retail_price: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Initial Stock *</label>
              <input className="input" type="number" required value={form.total_stock}
                onChange={e => setForm({ ...form, total_stock: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Description</label>
            <textarea className="input" value={form.description} rows={2}
              onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Premium heavy-cotton material..." />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [size, setSize] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category, size],
    queryFn: () => productService.list({ search: search || undefined, category: category || undefined, size: size || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      toast.success('Product created successfully!')
    },
    onError: () => toast.error('Failed to create product'),
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Product Catalog</h1>
          <p className="section-subtitle">
            {data?.items?.length || 0} active apparel SKUs in database
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Product SKU
        </button>
      </div>

      {/* Quick Category Filtering */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 6 }}>
        <button className={`badge ${!category ? 'badge-blue' : 'badge-gray'}`} style={{ cursor: 'pointer', padding: '6px 14px' }} onClick={() => setCategory('')}>
          All Categories
        </button>
        {CATEGORIES.map(c => (
          <button key={c} className={`badge ${category === c ? 'badge-blue' : 'badge-gray'}`} style={{ cursor: 'pointer', padding: '6px 14px' }} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Main Catalog View */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search by SKU, product name, design code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 120 }} value={size} onChange={e => setSize(e.target.value)}>
            <option value="">All Sizes</option>
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: 180 }} />
            ))}
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag />
            <h3>No products found</h3>
            <p>Modify your filter query or add a brand new SKU code</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Apparel Description</th>
                <th>Category</th>
                <th>Attributes</th>
                <th>Wholesale</th>
                <th>MSRP / Retail</th>
                <th>Available Stock</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((product: any) => (
                <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#3b82f6' }}>{product.sku}</td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{product.name}</div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))' }}>{product.description || 'No description'}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gray">{product.category}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="badge badge-blue" style={{ fontSize: 11, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Ruler size={10} /> {product.size}
                      </span>
                      <span className="badge badge-green" style={{ fontSize: 11, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Palette size={10} /> {product.color}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(product.wholesale_price)}</td>
                  <td>{formatCurrency(product.retail_price)}</td>
                  <td style={{ fontWeight: 700, color: product.total_stock <= product.min_stock_alert ? '#ef4444' : 'inherit' }}>
                    {product.total_stock} pcs
                    {product.total_stock <= product.min_stock_alert && (
                      <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 500 }}>LOW STOCK ALERT</div>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>{formatDate(product.updated_at)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={createMutation.mutate}
      />
    </div>
  )
}
