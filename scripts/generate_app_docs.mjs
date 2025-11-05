// Generate app_docs/apps: mirror of apps/* with per-file .md docs
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'apps');
const outRoot = path.join(repoRoot, 'app_docs', 'apps');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function isBinaryAsset(filePath) {
  return /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(filePath);
}

function shouldSkip(relPath) {
  return (
    relPath.split(path.sep).includes('node_modules') ||
    relPath.split(path.sep).includes('.next')
  );
}

function relFromSrc(absPath) {
  return path.relative(srcRoot, absPath);
}

function docPathFor(relPath) {
  // Keep original filename and append .md to avoid collisions
  return path.join(outRoot, relPath + '.md');
}

function toRouteFromRel(relPath) {
  // Expect format: web/app/.../page.tsx
  const parts = relPath.split(path.sep);
  const appIdx = parts.indexOf('app');
  if (appIdx === -1) return null;
  const trail = parts.slice(appIdx + 1); // e.g., ['products','page.tsx'] or ['products','[sku]','page.tsx']
  if (trail.length === 0) return null;
  const last = trail[trail.length - 1];
  if (!/page\.tsx?$/.test(last)) return null;
  const routeSegs = trail.slice(0, -1).map((seg) => seg.replace(/\[(.+?)\]/g, ':$1'));
  const route = '/' + routeSegs.join('/');
  return route === '//' ? '/' : route;
}

function readFileSafe(absPath) {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return '';
  }
}

function buildDocContent(absPath, relPath) {
  const filename = path.basename(relPath);
  const dirname = path.dirname(relPath);
  const title = `apps/${relPath}`;
  const sections = [];

  // General classification
  if (relPath.startsWith(path.join('web', 'app') + path.sep)) {
    if (/layout\.tsx$/.test(filename)) {
      sections.push('- **役割**: ルートレイアウト。テーマ、フォント、Analytics の設定。');
      sections.push('- **影響範囲**: 全ページに適用。');
    } else if (/page\.tsx$/.test(filename)) {
      const route = toRouteFromRel(relPath) || '(不明)';
      sections.push(`- **ルート**: ${route}`);
      sections.push('- **役割**: ページコンポーネント（UI合成、ページ固有の状態管理）');
      sections.push('- **データ**: 現状はモック。将来はサーバコンポーネント/サーバルート経由に切替。');
    } else if (/globals\.css$/.test(filename)) {
      sections.push('- **役割**: ベーススタイルとテーマトークンの定義');
    }
  } else if (relPath.startsWith(path.join('web', 'components') + path.sep)) {
    sections.push('- **役割**: 再利用可能なUIコンポーネント');
    if (relPath.split(path.sep).includes('ui')) {
      sections.push('- **カテゴリ**: UIプリミティブ（ボタン、入力、レイアウト等）');
    }
    if (/chart|sales|inventory|kpi|table|alerts|top-products/i.test(filename)) {
      sections.push('- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。');
    }
  } else if (relPath.startsWith(path.join('web', 'hooks') + path.sep)) {
    sections.push('- **役割**: カスタムフック（UI状態、レスポンシブ、トースト通知など）');
  } else if (relPath.startsWith(path.join('web', 'lib') + path.sep)) {
    sections.push('- **役割**: 汎用ユーティリティとモックデータ');
  } else if (relPath.startsWith(path.join('web', 'styles') + path.sep)) {
    sections.push('- **役割**: グローバル/テーマCSS');
  } else if (relPath.startsWith(path.join('web', 'public') + path.sep)) {
    sections.push('- **役割**: 静的アセット（画像/アイコン/プレースホルダ）');
  } else if (relPath.startsWith(path.join('web') + path.sep)) {
    if (/next\.config\.mjs$/.test(filename)) sections.push('- **役割**: Next.js 設定（型エラー無視・画像設定など）');
    if (/postcss\.config\.mjs$/.test(filename)) sections.push('- **役割**: PostCSS/Tailwind 設定');
    if (/tsconfig\.json$/.test(filename)) sections.push('- **役割**: TypeScript 設定（paths/nextプラグイン）');
    if (/package\.json$/.test(filename)) sections.push('- **役割**: パッケージ定義と依存関係');
    if (/next-env\.d\.ts$/.test(filename)) sections.push('- **役割**: Next.js 型サポートの環境宣言');
  } else if (relPath.startsWith(path.join('gas') + path.sep)) {
    sections.push('- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）');
    if (relPath.split(path.sep).includes('handlers')) {
      sections.push('- **備考**: Next.js サーバルートがプロキシし、GAS鍵はクライアントへ露出しない');
    }
  } else {
    sections.push('- **役割**: 開発補助/その他');
  }

  // Common security/caching notes
  const common = [
    '- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。',
    '- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。',
  ];

  // Quick file snippet (first lines) for context, for text files only
  let snippet = '';
  if (!isBinaryAsset(relPath)) {
    const content = readFileSafe(path.join(srcRoot, relPath));
    if (content) {
      const head = content.split(/\r?\n/).slice(0, 20).join('\n');
      snippet = '\n---\n<reference (first 20 lines)>\n\n' + '````\n' + head + '\n````\n';
    }
  }

  let header = `# ${title}`;
  if (isBinaryAsset(relPath)) {
    return (
      header +
      '\n\n- **バイナリアセット**\n- 用途: UIのプレースホルダー/アイコン\n\n' +
      common.join('\n') + '\n'
    );
  }

  return [header, '', ...sections, '', ...common, snippet].join('\n');
}

function writeDocFor(absPath) {
  const rel = relFromSrc(absPath);
  if (shouldSkip(rel)) return; // skip writing for heavy dirs
  const outPath = docPathFor(rel);
  ensureDir(path.dirname(outPath));
  const content = buildDocContent(absPath, rel);
  fs.writeFileSync(outPath, content);
}

function writeDirReadme(relPath) {
  const outDir = path.join(outRoot, relPath);
  ensureDir(outDir);
  const readmePath = path.join(outDir, 'README.md');
  const title = `# apps/${relPath || ''}`.replace(/\/$/, '');
  const extra = shouldSkip(relPath)
    ? '\nこのディレクトリはビルド成果物/依存のため、内容の詳細ドキュメントは生成しません。'
    : '';
  fs.writeFileSync(readmePath, `${title}\n${extra}\n`);
}

function walk(absDir) {
  const rel = relFromSrc(absDir);
  if (shouldSkip(rel)) {
    writeDirReadme(rel);
    return;
  }
  writeDirReadme(rel);
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      walk(abs);
    } else if (ent.isFile()) {
      writeDocFor(abs);
    }
  }
}

function main() {
  ensureDir(path.join(repoRoot, 'app_docs'));
  ensureDir(outRoot);
  fs.writeFileSync(path.join(repoRoot, 'app_docs', 'README.md'), '# app_docs\napps 配下の各ファイル/ディレクトリの役割・仕様メモ。実装前に参照してください。\n');
  walk(srcRoot);
  console.log('Generated docs under app_docs/apps');
}

main();


