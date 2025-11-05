'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, ArrowUpDown } from 'lucide-react'
import type { MasterItem } from '@/lib/types'

export function MastersView() {
  const [items, setItems] = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<keyof MasterItem>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // データ取得
  const fetchMasters = async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      
      const url = `/api/gas/masters${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error('マスタデータの取得に失敗しました')
      }
      
      const data = await res.json()
      
      if ('error' in data) {
        throw new Error(data.error)
      }
      
      setItems(data.items || [])
    } catch (err) {
      console.error(err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchMasters()
  }, [])
  
  // 検索
  const handleSearch = () => {
    fetchMasters()
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }
  
  // ソート
  const sortedItems = [...items].sort((a, b) => {
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
  
  const toggleSort = (key: keyof MasterItem) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* 検索バー */}
      <div className="flex gap-2">
        <Input
          placeholder="商品名、SKU、ASINで検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          {loading ? '検索中...' : '検索'}
        </Button>
      </div>
      
      {/* テーブル */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">
                    <Button variant="ghost" size="sm" onClick={() => toggleSort('sku')}>
                      SKU
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32">ASIN</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort('name')}>
                      商品名
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32">ブランド</TableHead>
                  <TableHead className="text-right w-24">
                    <Button variant="ghost" size="sm" onClick={() => toggleSort('setSize')}>
                      セット個数
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-24">最小ロット</TableHead>
                  <TableHead className="text-right w-32">
                    <Button variant="ghost" size="sm" onClick={() => toggleSort('purchasePrice')}>
                      仕入れ値
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-28">単価/個</TableHead>
                  <TableHead className="w-24">属性</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : sortedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedItems.map((item) => (
                    <TableRow key={item.sku}>
                      <TableCell className="font-mono text-xs">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.asin}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="truncate">{item.name}</p>
                          {item.productCode && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.productCode}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.brand || '-'}</TableCell>
                      <TableCell className="text-right">
                        {item.setSize}個
                      </TableCell>
                      <TableCell className="text-right">
                        {item.minLot}セット
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{item.purchasePrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{item.unitPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {item.hazard && (
                            <Badge variant="destructive" className="text-xs">
                              危険物
                            </Badge>
                          )}
                          {item.hasExpiry && (
                            <Badge variant="outline" className="text-xs">
                              期限要
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* 件数表示 */}
      {!loading && items.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {items.length}件表示
        </div>
      )}
    </div>
  )
}

