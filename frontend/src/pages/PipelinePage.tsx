import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, closestCenter,
  DragOverlay, useSensor, useSensors, PointerSensor
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, DollarSign, User, Calendar } from 'lucide-react'
import { opportunityService } from '@/services'
import { formatCurrency, formatDate, LEAD_STAGE_CONFIG } from '@/lib/utils'
import toast from 'react-hot-toast'

const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost']

function KanbanCard({ opportunity, isDragging }: { opportunity: any; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: opportunity.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }



  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-card"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'hsl(var(--text-muted))', marginTop: 1 }}>
          <GripVertical size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {opportunity.title}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: 4 }}>
            <User size={10} />Customer #{opportunity.customer_id}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#10b981' }}>
          <DollarSign size={12} />{formatCurrency(opportunity.value)}
        </div>
        <div style={{
          background: 'hsl(var(--bg-muted))',
          borderRadius: 6,
          padding: '2px 8px',
          fontSize: 11,
          fontWeight: 600,
          color: '#3b82f6',
        }}>
          {opportunity.probability}%
        </div>
      </div>

      {opportunity.expected_close_date && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 8 }}>
          <Calendar size={10} />{formatDate(opportunity.expected_close_date)}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ stage, items }: { stage: string; items: any[] }) {
  const config = LEAD_STAGE_CONFIG[stage]
  const totalValue = items.reduce((sum, i) => sum + (i.value || 0), 0)

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: config?.color || '#888' }} />
          <span style={{ fontSize: 13 }}>{config?.label || stage}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: 'hsl(var(--bg-card))',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
          }}>{items.length}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginBottom: 12 }}>
        {formatCurrency(totalValue)}
      </div>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(opp => <KanbanCard key={opp.id} opportunity={opp} />)}
      </SortableContext>
      {items.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '20px 12px',
          color: 'hsl(var(--text-muted))',
          fontSize: 12,
          border: '2px dashed hsl(var(--border))',
          borderRadius: 10,
        }}>
          No opportunities
        </div>
      )}
    </div>
  )
}

export default function PipelinePage() {
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<number | null>(null)

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => opportunityService.list(),
  })

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: string }) =>
      opportunityService.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
    onError: () => toast.error('Failed to move opportunity'),
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const groupedByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = opportunities.filter((o: any) => o.stage === stage)
    return acc
  }, {} as Record<string, any[]>)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const draggedOpp = opportunities.find((o: any) => o.id === active.id)
    // Find which column the item was dropped into
    const overOpp = opportunities.find((o: any) => o.id === over.id)
    if (draggedOpp && overOpp && draggedOpp.stage !== overOpp.stage) {
      updateStageMutation.mutate({ id: draggedOpp.id, stage: overOpp.stage })
    }
  }

  const activeOpp = activeId ? opportunities.find((o: any) => o.id === activeId) : null

  // Totals
  const totalValue = opportunities.reduce((s: number, o: any) => s + (o.value || 0), 0)
  const wonValue = (groupedByStage.won || []).reduce((s: number, o: any) => s + (o.value || 0), 0)

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Sales Pipeline</h1>
          <p className="section-subtitle">
            {opportunities.length} opportunities · {formatCurrency(totalValue)} total value ·
            <span style={{ color: '#10b981', fontWeight: 600 }}> {formatCurrency(wonValue)} won</span>
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Add Opportunity
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', gap: 16 }}>
          {STAGES.slice(0, 5).map(s => (
            <div key={s} className="skeleton" style={{ flex: '0 0 280px', height: 400 }} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage}
                stage={stage}
                items={groupedByStage[stage] || []}
              />
            ))}
          </div>
          <DragOverlay>
            {activeOpp && <KanbanCard opportunity={activeOpp} isDragging />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
