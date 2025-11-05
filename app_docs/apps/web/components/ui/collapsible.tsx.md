# apps/web/components/ui/collapsible.tsx

- **役割**: 再利用可能なUIコンポーネント
- **カテゴリ**: UIプリミティブ（ボタン、入力、レイアウト等）

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
'use client'

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}
````
