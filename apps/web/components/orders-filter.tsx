'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X } from 'lucide-react'
import { useState } from 'react'
import type { OrderFilters, OrderStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

interface OrdersFilterProps {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
}

const ALL_STATUSES: OrderStatus[] = [
  'sup_依頼中',
  'be_メーカー取寄中',
  'be_納品手続完了',
  'sup_受取完了',
  'sup_fba出荷完了',
  '保留',
  '返品',
]

export function OrdersFilter({ filters, onFiltersChange }: OrdersFilterProps) {
  const [localFilters, setLocalFilters] = useState<OrderFilters>(filters)
  const [isOpen, setIsOpen] = useState(false)
  
  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }
  
  const handleClear = () => {
    const cleared = {}
    setLocalFilters(cleared)
    onFiltersChange(cleared)
  }
  
  const hasActiveFilters = Object.keys(filters).length > 0
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          フィルタ
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {Object.keys(filters).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">フィルタ条件</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 px-2"
              >
                <X className="mr-1 h-3 w-3" />
                クリア
              </Button>
            )}
          </div>
          
          {/* 発注ID */}
          <div className="space-y-2">
            <Label htmlFor="po_id">発注ID</Label>
            <Input
              id="po_id"
              placeholder="PO-20251102-0001"
              value={localFilters.po_id || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, po_id: e.target.value || undefined })
              }
            />
          </div>
          
          {/* ステータス */}
          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <Select
              value={localFilters.statuses?.[0] || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  statuses: value === 'all' ? undefined : [value as OrderStatus],
                })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {ALL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 商品名 */}
          <div className="space-y-2">
            <Label htmlFor="productName">商品名</Label>
            <Input
              id="productName"
              placeholder="商品名で検索..."
              value={localFilters.productName || ''}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  productName: e.target.value || undefined,
                })
              }
            />
          </div>
          
          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              placeholder="00-KOU9-B1OP"
              value={localFilters.sku || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, sku: e.target.value || undefined })
              }
            />
          </div>
          
          {/* 発注日範囲 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="fromDate">発注日（開始）</Label>
              <Input
                id="fromDate"
                type="date"
                value={localFilters.fromDate || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    fromDate: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">発注日（終了）</Label>
              <Input
                id="toDate"
                type="date"
                value={localFilters.toDate || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    toDate: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>
          
          {/* 適用ボタン */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleApply} className="flex-1">
              適用
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="flex-1"
            >
              キャンセル
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

