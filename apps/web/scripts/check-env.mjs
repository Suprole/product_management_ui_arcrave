#!/usr/bin/env node

/**
 * 環境変数チェックスクリプト
 * 
 * 使い方:
 *   node scripts/check-env.mjs
 */

const REQUIRED_ENV_VARS = [
  'GAS_API_BASE',
  'GAS_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'ALLOWED_EMAILS',
  'REVALIDATE_SECRET'
]

const OPTIONAL_ENV_VARS = [
  'NEXTAUTH_URL'
]

console.log('🔍 環境変数チェック\n')
console.log('=' .repeat(60))

let hasErrors = false
let hasWarnings = false

// 必須環境変数のチェック
console.log('\n📋 必須環境変数:')
REQUIRED_ENV_VARS.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    const displayValue = varName.includes('KEY') || varName.includes('SECRET') || varName.includes('TOKEN')
      ? `${'*'.repeat(Math.min(value.length, 20))} (${value.length}文字)`
      : value
    console.log(`  ✅ ${varName}: ${displayValue}`)
  } else {
    console.log(`  ❌ ${varName}: 未設定`)
    hasErrors = true
  }
})

// オプション環境変数のチェック
console.log('\n📋 オプション環境変数:')
OPTIONAL_ENV_VARS.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`)
  } else {
    console.log(`  ⚠️  ${varName}: 未設定（オプション）`)
    hasWarnings = true
  }
})

// バリデーション
console.log('\n🔬 バリデーション:')

// GAS_API_BASE の形式チェック
const gasApiBase = process.env.GAS_API_BASE
if (gasApiBase) {
  if (gasApiBase.includes('/exec')) {
    console.log('  ✅ GAS_API_BASE: 正しい形式 (/exec で終わっている)')
  } else {
    console.log('  ⚠️  GAS_API_BASE: /exec で終わっていません')
    hasWarnings = true
  }
  
  if (gasApiBase.startsWith('https://')) {
    console.log('  ✅ GAS_API_BASE: HTTPSを使用')
  } else {
    console.log('  ⚠️  GAS_API_BASE: HTTPSではありません')
    hasWarnings = true
  }
}

// NEXTAUTH_SECRET の長さチェック
const nextAuthSecret = process.env.NEXTAUTH_SECRET
if (nextAuthSecret) {
  if (nextAuthSecret.length >= 32) {
    console.log(`  ✅ NEXTAUTH_SECRET: 十分な長さ (${nextAuthSecret.length}文字)`)
  } else {
    console.log(`  ⚠️  NEXTAUTH_SECRET: 短すぎます (${nextAuthSecret.length}文字, 推奨: 32文字以上)`)
    hasWarnings = true
  }
}

// GAS_API_KEY の長さチェック
const gasApiKey = process.env.GAS_API_KEY
if (gasApiKey) {
  if (gasApiKey.length >= 20) {
    console.log(`  ✅ GAS_API_KEY: 十分な長さ (${gasApiKey.length}文字)`)
  } else {
    console.log(`  ⚠️  GAS_API_KEY: 短すぎる可能性があります (${gasApiKey.length}文字, 推奨: 20文字以上)`)
    hasWarnings = true
  }
}

// ALLOWED_EMAILS の形式チェック
const allowedEmails = process.env.ALLOWED_EMAILS
if (allowedEmails) {
  const emails = allowedEmails.split(',').map(e => e.trim()).filter(e => e.length > 0)
  console.log(`  ✅ ALLOWED_EMAILS: ${emails.length}件のメールアドレス`)
  emails.forEach(email => {
    if (email.includes('@')) {
      console.log(`     - ${email}`)
    } else {
      console.log(`     ⚠️  - ${email} (無効な形式)`)
      hasWarnings = true
    }
  })
}

// 結果サマリ
console.log('\n' + '='.repeat(60))
if (!hasErrors && !hasWarnings) {
  console.log('\n✅ すべての環境変数が正しく設定されています！')
  process.exit(0)
} else if (hasErrors) {
  console.log('\n❌ エラー: 必須の環境変数が不足しています')
  console.log('\n解決方法:')
  console.log('  1. .env.localファイルを作成してください')
  console.log('  2. ENV_SETUP.mdを参照して環境変数を設定してください')
  console.log('  3. Vercelの場合、ダッシュボードで環境変数を設定してください')
  process.exit(1)
} else if (hasWarnings) {
  console.log('\n⚠️  警告: 一部の設定に問題がある可能性があります')
  console.log('上記の警告を確認して、必要に応じて修正してください')
  process.exit(0)
}

