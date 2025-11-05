'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'
import type { Order } from '@/lib/types'

interface OrderEditDialogProps {
  order: Order
  onClose: () => void
  onSuccess: () => void
}

export function OrderEditDialog({ order, onClose, onSuccess }: OrderEditDialogProps) {
  const [taxRate, setTaxRate] = useState((order.taxRate * 100).toString())
  const [invoiceNo, setInvoiceNo] = useState(order.invoiceNo || '')
  const [arrivalDate, setArrivalDate] = useState(order.arrivalDate || '')
  const [remarks, setRemarks] = useState(order.remarks || '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  
  const handleSave = async () => {
    setSaving(true)
    
    try {
      // 税率を小数に変換（10% → 0.1）
      const taxRateDecimal = parseFloat(taxRate) / 100
      
      if (isNaN(taxRateDecimal) || taxRateDecimal < 0 || taxRateDecimal > 1) {
        throw new Error('消費税率は0〜100の範囲で入力してください')
      }
      
      const res = await fetch(`/api/gas/orders/${order.po_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxRate: taxRateDecimal,
          invoiceNo: invoiceNo || undefined,
          arrivalDate: arrivalDate || undefined,
          remarks: remarks || undefined,
          updatedBy: 'user@example.com', // TODO: 実際のユーザー情報を使用
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '更新に失敗しました')
      }
      
      toast({
        title: '✅ 更新完了',
        description: `発注ID: ${order.po_id} の情報を更新しました`,
        duration: 3000,
      })
      
      // 少し遅延してから閉じる（トーストを見せるため）
      setTimeout(() => {
        onSuccess()
      }, 500)
    } catch (err) {
      toast({
        title: '❌ エラー',
        description: err instanceof Error ? err.message : '更新に失敗しました',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>発注情報の編集</DialogTitle>
          <DialogDescription>
            発注ID: {order.po_id}
            <br />
            商品名: {order.productName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 消費税率 */}
          <div className="space-y-2">
            <Label htmlFor="taxRate">消費税率 (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground">
              例: 10% の場合は「10」と入力
            </p>
          </div>
          
          {/* 伝票No. */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNo">伝票No.</Label>
            <Input
              id="invoiceNo"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="1234567890123"
            />
          </div>
          
          {/* 到着予定日 */}
          <div className="space-y-2">
            <Label htmlFor="arrivalDate">到着予定日</Label>
            <Input
              id="arrivalDate"
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
            />
          </div>
          
          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="remarks">備考</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="備考を入力..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

