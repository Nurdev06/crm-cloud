import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Search, FileText, Download, ExternalLink, Calendar, HardDrive } from 'lucide-react'
import toast from 'react-hot-toast'

interface CloudDoc {
  id: number
  name: string
  size: string
  uploaded_by: string
  uploaded_at: string
  url: string
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [docs, setDocs] = useState<CloudDoc[]>([
    {
      id: 1,
      name: 'Autumn_Collection_2026_Catalog.pdf',
      size: '12.4 MB',
      uploaded_by: 'sales_manager',
      uploaded_at: '2026-06-03T10:00:00Z',
      url: '#'
    },
    {
      id: 2,
      name: 'Invoice_INV-00001_Signed.pdf',
      size: '1.2 MB',
      uploaded_by: 'finance_manager',
      uploaded_at: '2026-06-04T08:15:00Z',
      url: '#'
    },
    {
      id: 3,
      name: 'Logistics_Safety_Guidelines.docx',
      size: '4.8 MB',
      uploaded_by: 'super_admin',
      uploaded_at: '2026-05-20T14:30:00Z',
      url: '#'
    }
  ])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const newDoc: CloudDoc = {
      id: Date.now(),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploaded_by: 'sales_rep',
      uploaded_at: new Date().toISOString(),
      url: '#'
    }

    setDocs([newDoc, ...docs])
    toast.success('Document uploaded to S3 bucket!')
  }

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Cloud Storage</h1>
          <p className="section-subtitle">
            Shared corporate catalogs, signed client invoice PDFs, and packing slips.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Upload size={16} /> Upload Document
          </label>
        </div>
      </div>

      {/* Cloud Drive Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
            <span>Bucket Capacity</span>
            <HardDrive size={16} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>18.4 MB / 10 GB</div>
        </div>
      </div>

      {/* Docs Grid */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="search-bar" style={{ maxWidth: 400 }}>
            <Search size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <input
              placeholder="Search shared documents by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="empty-state">
            <FileText />
            <h3>No documents found</h3>
            <p>Upload files to start sharing</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>File Size</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={18} style={{ color: '#3b82f6' }} />
                      <span style={{ fontWeight: 600 }}>{doc.name}</span>
                    </div>
                  </td>
                  <td>{doc.size}</td>
                  <td>
                    <span className="badge badge-gray">{doc.uploaded_by}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'hsl(var(--text-muted))' }}>
                      <Calendar size={12} />
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={doc.url} className="btn btn-ghost btn-icon" title="Download">
                        <Download size={14} />
                      </a>
                      <a href={doc.url} target="_blank" className="btn btn-ghost btn-icon" title="View Source">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
