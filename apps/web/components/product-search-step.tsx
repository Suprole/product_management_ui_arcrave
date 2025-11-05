'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import type { ProductSearchResult } from '@/lib/types'

interface ProductSearchStepProps {
  onSelect: (product: ProductSearchResult) => void
}

export function ProductSearchStep({ onSelect }: ProductSearchStepProps) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<ProductSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  
  const handleSearch = async () => {
    if (!query.trim()) {
      // 空の場合は全件取得
      return
    }
    
    setLoading(true)
    setSearched(true)
    
    try {
      const params = new URLSearchParams({ q: query })
      const res = await fetch(`/api/gas/products/search?${params.toString()}`)
      
      if (!res.ok) {
        throw new Error('商品検索に失敗しました')
      }
      
      const data = await res.json()
      
      if ('error' in data) {
        throw new Error(data.error)
      }
      
      setProducts(data.items || [])
    } catch (err) {
      console.error(err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }
  
  // Enterキーで検索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>商品検索</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        
        {/* 検索結果テーブル */}
        {searched && (
          <div className="border rounded-lg overflow-hidden">
            {products.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                商品が見つかりませんでした
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名</TableHead>
                    <TableHead className="w-32">SKU</TableHead>
                    <TableHead className="w-32">ブランド</TableHead>
                    <TableHead className="text-right w-24">セット個数</TableHead>
                    <TableHead className="text-right w-24">最小ロット</TableHead>
                    <TableHead className="text-right w-32">仕入れ値</TableHead>
                    <TableHead className="w-24">危険物</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.sku}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.asin}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {product.sku}
                      </TableCell>
                      <TableCell>{product.brand || '-'}</TableCell>
                      <TableCell className="text-right">
                        {product.setSize}個
                      </TableCell>
                      <TableCell className="text-right">
                        {product.minLot}セット
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{product.purchasePrice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {product.hazard && (
                          <Badge variant="destructive" className="text-xs">
                            危険物
                          </Badge>
                        )}
                        {product.hasExpiry && (
                          <Badge variant="outline" className="text-xs">
                            期限要
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => onSelect(product)}
                        >
                          選択
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
        
        {!searched && (
          <div className="p-8 text-center text-muted-foreground border rounded-lg">
            商品名、SKU、またはASINで検索してください
          </div>
        )}
      </CardContent>
    </Card>
  )
}

