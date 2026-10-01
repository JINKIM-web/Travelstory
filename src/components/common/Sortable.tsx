import type { ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function Item({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 10 : undefined, touchAction: 'manipulation' }}
    >
      {children}
    </div>
  )
}

/** ids 를 드래그(또는 키보드)로 재정렬하는 목록. 클릭은 6px 이상 움직여야 드래그로 인식한다. */
export function SortableList({
  ids,
  onReorder,
  horizontal,
  className,
  render,
}: {
  ids: string[]
  onReorder: (ids: string[]) => void
  horizontal?: boolean
  className?: string
  render: (id: string, index: number) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={horizontal ? horizontalListSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {ids.map((id, i) => (
            <Item key={id} id={id}>
              {render(id, i)}
            </Item>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
