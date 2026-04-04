'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CartItem, ProductSearchResult } from '@/lib/types'

const STORAGE_KEY = 'order-cart:v1'
const CART_EVENT = 'order-cart-updated'

export type CartItemInput = ProductSearchResult & {
  setCount: number
  taxRate: number
  remarks?: string
}

export type CartValidation = {
  isValid: boolean
  errors: string[]
}

export type CartSummary = {
  itemCount: number
  totalSetCount: number
  totalQuantity: number
  subtotal: number
  tax: number
  total: number
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function emitCartUpdated() {
  if (!isBrowser()) return
  window.dispatchEvent(new CustomEvent(CART_EVENT))
}

function normalizeCartItem(input: CartItemInput): CartItem {
  return {
    ...input,
    remarks: input.remarks || '',
    addedAt: new Date().toISOString(),
  }
}

export function validateCartItem(item: Pick<CartItem, 'setCount' | 'minLot' | 'setSize' | 'purchasePrice'>): CartValidation {
  const errors: string[] = []

  if (!Number.isFinite(item.setCount) || item.setCount <= 0) {
    errors.push('セット数は1以上を指定してください')
  }

  if (!Number.isFinite(item.minLot) || item.minLot <= 0) {
    errors.push('最小ロット情報が不正です')
  }

  if (!Number.isFinite(item.setSize) || item.setSize <= 0) {
    errors.push('セット個数情報が不正です')
  }

  if (!Number.isFinite(item.purchasePrice) || item.purchasePrice <= 0) {
    errors.push('仕入れ値情報が不正です')
  }

  if (item.minLot > 0 && item.setCount > 0 && item.setCount % item.minLot !== 0) {
    errors.push(`セット数は最小ロット（${item.minLot}セット）の倍数で指定してください`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function readOrderCart(): CartItem[] {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('カートの読み込みに失敗しました:', error)
    return []
  }
}

function writeOrderCart(items: CartItem[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  emitCartUpdated()
}

export function upsertOrderCartItem(input: CartItemInput) {
  const item = normalizeCartItem(input)
  const items = readOrderCart()
  const existingIndex = items.findIndex((cartItem) => cartItem.sku === item.sku)

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      ...item,
      addedAt: items[existingIndex].addedAt,
    }
  } else {
    items.push(item)
  }

  writeOrderCart(items)
  return items
}

export function removeOrderCartItem(sku: string) {
  writeOrderCart(readOrderCart().filter((item) => item.sku !== sku))
}

export function clearOrderCart() {
  writeOrderCart([])
}

export function getOrderCartItem(sku: string) {
  return readOrderCart().find((item) => item.sku === sku) || null
}

export function getCartSummary(items: CartItem[]): CartSummary {
  return items.reduce<CartSummary>(
    (summary, item) => {
      const quantity = item.setCount * item.setSize
      const subtotal = item.unitPrice * quantity
      const tax = subtotal * item.taxRate

      summary.itemCount += 1
      summary.totalSetCount += item.setCount
      summary.totalQuantity += quantity
      summary.subtotal += subtotal
      summary.tax += tax
      summary.total += subtotal + tax

      return summary
    },
    { itemCount: 0, totalSetCount: 0, totalQuantity: 0, subtotal: 0, tax: 0, total: 0 },
  )
}

function subscribeToCart(callback: () => void) {
  if (!isBrowser()) return () => {}

  const handler = () => callback()
  window.addEventListener(CART_EVENT, handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener(CART_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function useOrderCart() {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const sync = () => setItems(readOrderCart())
    sync()
    return subscribeToCart(sync)
  }, [])

  const summary = useMemo(() => getCartSummary(items), [items])

  return {
    items,
    summary,
    getItem: getOrderCartItem,
    addItem: upsertOrderCartItem,
    updateItem: upsertOrderCartItem,
    removeItem: removeOrderCartItem,
    clearCart: clearOrderCart,
    validateItem: validateCartItem,
  }
}
