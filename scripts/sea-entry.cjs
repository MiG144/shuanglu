// ============================================================================
// 双陆棋 · SEA 入口（单文件 exe 的主脚本，CommonJS）
// 职责：
//   1) 幂等：server.json 存在且端口响应 → 直接打开浏览器退出
//   2) 否则启动内置 HTTP 服务器（从 sea-assets.cjs 内嵌资源应答），
//      端口默认 4173、被占用自动 +1
//   3) 写 server.json { pid, port }（供停止用）
//   4) 打开默认浏览器到主菜单
//   5) 提供 GET /__shutdown__ 端点：优雅退出服务器并清理 server.json
// 本文件目标平台为 Windows/macOS/Linux 均可（由 Node SEA 注入运行时代码）。
// ============================================================================
'use strict'

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { execFileSync } = require('node:child_process')

// 注入的资源映射（打包期由 make-sea-assets.mjs 生成同目录 sea-assets.cjs）
const ASSETS = require('./sea-assets.cjs').ASSETS

// 运行时所在目录（exe 部署目录）：server.json 写在这里，随 exe 一起拷贝
const APP_DIR = path.dirname(process.execPath)
const PID_FILE = path.join(APP_DIR, 'server.json')
const BASE_PORT = 4173
const SHUTDOWN_PATH = '/__shutdown__'

// ---------- 内部辅助 ----------
function findPortFrom(start) {
  return new Promise((resolve, reject) => {
    const srv = require('node:net').createServer()
    srv.unref()
    srv.on('error', () => resolve(findPortFrom(start + 1)))
    srv.listen(start, '127.0.0.1', () => {
      const port = start
      srv.close(() => resolve(port))
    })
    setTimeout(() => reject(new Error('端口探测超时')), 5000)
  })
}

function ping(url, ms = 600) {
  return new Promise((resolve) => {
    const req = http.get(url, (r) => {
      r.resume()
      resolve(r.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(ms, () => { req.destroy(); resolve(false) })
  })
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') execFileSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore' })
    else if (process.platform === 'darwin') execFileSync('open', [url], { stdio: 'ignore' })
    else execFileSync('xdg-open', [url], { stdio: 'ignore' })
  } catch {
    /* 忽略打开失败 */
  }
}

function serve(req, res) {
  const url = req.url || '/'
  if (url === SHUTDOWN_PATH) {
    // 停止：清理并退出
    try { fs.rmSync(PID_FILE, { force: true }) } catch {}
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('shutdown')
    setTimeout(() => process.exit(0), 50)
    return
  }
  let pathName = url.split('?')[0]
  pathName = decodeURIComponent(pathName)
  if (pathName === '/') pathName = '/index.html'
  const asset = ASSETS[pathName]
  if (!asset) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not Found')
    return
  }
  res.writeHead(200, { 'Content-Type': asset.mime, 'Cache-Control': 'no-cache' })
  res.end(Buffer.from(asset.b64, 'base64'))
}

// ---------- 主流程 ----------
async function main() {
  // 幂等：已有服务（server.json + 端口响应）→ 直接打开浏览器
  let existingPort = null
  try {
    if (fs.existsSync(PID_FILE)) {
      const j = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'))
      if (await ping(`http://127.0.0.1:${j.port}/`)) existingPort = j.port
    }
  } catch {
    /* 忽略损坏的 pid 文件 */
  }
  if (existingPort) {
    console.log(`[双陆棋] 服务已在运行：http://127.0.0.1:${existingPort}/`)
    openBrowser(`http://127.0.0.1:${existingPort}/`)
    process.exit(0)
  }

  const port = await findPortFrom(BASE_PORT)
  const server = http.createServer(serve)
  await new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })

  fs.writeFileSync(PID_FILE, JSON.stringify({ pid: process.pid, port }), 'utf8')

  const url = `http://127.0.0.1:${port}/`
  console.log(`[双陆棋] 已启动：${url}（按需停止：删除或请求 /__shutdown__）`)
  openBrowser(url)

  // 保持进程（server.listen 已持有事件循环）
}

main().catch((err) => {
  console.error('[双陆棋] 启动失败：', err && err.message)
  process.exitCode = 1
})