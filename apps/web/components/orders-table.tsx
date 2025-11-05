'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Mail, ArrowUpDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Order, OrderStatus } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { OrderEditDialog } from '@/components/order-edit-dialog'

interface OrdersTableProps {
  orders: Order[]
  onRefresh: () => void
}

// すべてのステータス（遷移制限なし）
const ALL_STATUSES: OrderStatus[] = [
  'sup_依頼中',
  'be_メーカー取寄中',
  'be_納品手続完了',
  'sup_受取完了',
  'sup_fba出荷完了',
  '保留',
  '返品',
]

export function OrdersTable({ orders, onRefresh }: OrdersTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<keyof Order>('orderDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    order: Order
    newStatus: OrderStatus
  } | null>(null)
  const { toast } = useToast()
  
  // ソート処理
  const sortedOrders = [...orders].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    return 0
  })
  
  // 行選択
  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.po_id)))
    }
  }
  
  const toggleSelectOrder = (poId: string) => {
    const newSet = new Set(selectedOrders)
    if (newSet.has(poId)) {
      newSet.delete(poId)
    } else {
      newSet.add(poId)
    }
    setSelectedOrders(newSet)
  }
  
  // ステータス変更
  const handleStatusChange = async () => {
    if (!statusChangeDialog) return
    
    const { order, newStatus } = statusChangeDialog
    
    try {
      const res = await fetch(`/api/gas/orders/${order.po_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus,
          updatedBy: 'user@example.com', // TODO: 実際のユーザー情報を使用
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ステータス変更に失敗しました')
      }
      
      toast({
        title: 'ステータス変更完了',
        description: `${order.po_id} のステータスを ${STATUS_LABELS[newStatus]} に変更しました`,
      })
      
      onRefresh()
    } catch (err) {
      toast({
        title: 'エラー',
        description: err instanceof Error ? err.message : 'ステータス変更に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setStatusChangeDialog(null)
    }
  }
  
  // メール送信
  const handleSendMail = async (type: 'request' | 'delivery') => {
    if (selectedOrders.size === 0) {
      toast({
        title: '選択エラー',
        description: '送信対象の発注を選択してください',
        variant: 'destructive',
      })
      return
    }
    
    const poIds = Array.from(selectedOrders)
    
    try {
      const res = await fetch('/api/gas/orders/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, poIds }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'メール送信に失敗しました')
      }
      
      const data = await res.json()
      
      toast({
        title: 'メール送信完了',
        description: `${data.sentCount}件の発注について${
          type === 'request' ? '依頼メール' : '納品完了メール'
        }を送信しました`,
      })
      
      setSelectedOrders(new Set())
    } catch (err) {
      toast({
        title: 'エラー',
        description: err instanceof Error ? err.message : 'メール送信に失敗しました',
        variant: 'destructive',
      })
    }
  }
  
  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* アクションバー */}
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-2 border-b p-4">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.size}件選択中
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSendMail('request')}
              >
                <Mail className="mr-2 h-4 w-4" />
                依頼メール送信
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSendMail('delivery')}
              >
                <Mail className="mr-2 h-4 w-4" />
                納品完了メール送信
              </Button>
            </div>
          )}
          
          {/* テーブル */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-40">発注ID</TableHead>
                  <TableHead className="w-32">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (sortKey === 'orderDate') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortKey('orderDate')
                          setSortOrder('desc')
                        }
                      }}
                    >
                      発注日
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>商品名</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (sortKey === 'quantity') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortKey('quantity')
                          setSortOrder('desc')
                        }
                      }}
                    >
                      数量
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">単価</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (sortKey === 'subtotal') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortKey('subtotal')
                          setSortOrder('desc')
                        }
                      }}
                    >
                      金額
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32">消費税率</TableHead>
                  <TableHead className="w-32">伝票No.</TableHead>
                  <TableHead className="w-32">到着予定日</TableHead>
                  <TableHead className="w-40">ステータス</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center">
                      発注データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.map((order) => (
                    <TableRow key={order.po_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.has(order.po_id)}
                          onCheckedChange={() => toggleSelectOrder(order.po_id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {order.po_id}
                      </TableCell>
                      <TableCell>{order.orderDate}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate font-medium">{order.productName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {order.sku}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.quantity}個
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{order.unitPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{order.subtotal.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {(order.taxRate * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell>{order.invoiceNo || '-'}</TableCell>
                      <TableCell>{order.arrivalDate || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => {
                            const newStatus = value as OrderStatus
                            // 遷移制限なし：すべてのステータスへの変更を許可
                            setStatusChangeDialog({ order, newStatus })
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              <Badge className={STATUS_COLORS[order.status]}>
                                {STATUS_LABELS[order.status]}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingOrder(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* ステータス変更確認ダイアログ */}
      <AlertDialog
        open={!!statusChangeDialog}
        onOpenChange={() => setStatusChangeDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ステータス変更の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeDialog && (
                <>
                  発注ID: {statusChangeDialog.order.po_id}
                  <br />
                  ステータスを「{STATUS_LABELS[statusChangeDialog.order.status]}」から「
                  {STATUS_LABELS[statusChangeDialog.newStatus]}」に変更します。
                  <br />
                  よろしいですか？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>
              変更する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 編集ダイアログ */}
      {editingOrder && (
        <OrderEditDialog
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSuccess={() => {
            setEditingOrder(null)
            onRefresh()
          }}
        />
      )}
    </>
  )
}

