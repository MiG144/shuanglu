// ============================================================================
// 双陆棋 · 生成 SEA 内嵌资源映射（构建期脚本）
// 读取 dist/ 所有产物，输出 CJS 模块 dist-app/sea-assets.cjs：
//   ASSETS = { '/': {...}, '/index.html': {...}, '/assets/xxx.js': {...} }
// 供 SEA 入口（sea-entry.cjs）内置 HTTP 服务器使用，实现单文件离线可玩。
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const outDir = path.join(root, 'dist-app')
const outFile = path.join(outDir, 'sea-assets.cjs')

if (!fs.existsSync(dist)) {
  console.error('[assets] dist 不存在，请先 npm run build')
  process.exit(1)
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.map': 'application/json',
}

function walk(dir, base) {
  const out = []
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f)
    const st = fs.statSync(full)
    if (st.isDirectory()) out.push(...walk(full, base))
    else {
      const rel = path.relative(base, full).split(path.sep).join('/')
      out.push({ rel: '/' + rel, full })
    }
  }
  return out
}

fs.mkdirSync(outDir, { recursive: true })
const files = walk(dist, dist)

let entries = ''
for (const { rel, full } of files) {
  const buf = fs.readFileSync(full)
  const mime = MIME[path.extname(full).toLowerCase()] || 'application/octet-stream'
  const b64 = buf.toString('base64')
  entries += `  ${JSON.stringify(rel)}: { mime: ${JSON.stringify(mime)}, b64: ${JSON.stringify(b64)} },\n`
}

// 生成 CJS 数据模块
const content = `// 生成文件：请勿手动编辑（由 scripts/make-sea-assets.mjs 生成）\n'use strict';\nmodule.exports = {\n  ASSETS: {\n${entries}  },\n};\n`
fs.writeFileSync(outFile, content, 'utf8')

// 同时生成"完整 SEA 主文件"：把资源数据内联进 sea-entry.cjs（SEA 无法 require 外部模块）
const entrySrc = fs.readFileSync(path.join(__dirname, 'sea-entry.cjs'), 'utf8')
const packed = entrySrc.replace(
  "const ASSETS = require('./sea-assets.cjs').ASSETS",
  `// 内联资源（构建期生成）\nconst ASSETS = {\n${entries}}`,
)
fs.writeFileSync(path.join(outDir, 'sea-app.cjs'), packed, 'utf8')

const total = files.reduce((a, f) => a + fs.statSync(f.full).size, 0)
console.log(`[assets] ${files.length} 个文件 → sea-assets.cjs + sea-app.cjs（${total} bytes → ~${Math.ceil(total * 4 / 3)} b64）`)