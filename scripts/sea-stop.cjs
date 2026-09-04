// ============================================================================
// 双陆棋 · SEA 停止入口（单文件 exe）
// 读取 exe 同目录 server.json 中的端口，请求 /__shutdown__ 优雅停止，
// 成功后清理 server.json。
// ============================================================================
'use strict'

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const APP_DIR = path.dirname(process.execPath)
const PID_FILE = path.join(APP_DIR, 'server.json')

function pingShutdown(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/__shutdown__`, (r) => {
      r.resume()
      resolve(r.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1500, () => { req.destroy(); resolve(false) })
  })
}

async function main() {
  if (!fs.existsSync(PID_FILE)) {
    console.log('[双陆棋] 服务未在运行（没有 server.json）。')
    process.exit(0)
  }
  let port
  try {
    port = JSON.parse(fs.readFileSync(PID_FILE, 'utf8')).port
  } catch {
    try { fs.rmSync(PID_FILE, { force: true }) } catch {}
    console.log('[双陆棋] server.json 无效，已清理。')
    process.exit(0)
  }
  if (port && (await pingShutdown(port))) {
    // 等待入口清理 server.json
    const deadline = Date.now() + 3000
    while (Date.now() < deadline && fs.existsSync(PID_FILE)) {
      await new Promise((r) => setTimeout(r, 100))
    }
    if (fs.existsSync(PID_FILE)) {
      try { fs.rmSync(PID_FILE, { force: true }) } catch {}
    }
    console.log('[双陆棋] 服务已停止。')
    process.exit(0)
  }
  // 端口不通：清理残留文件
  try { fs.rmSync(PID_FILE, { force: true }) } catch {}
  console.log('[双陆棋] 未发现活跃服务，已清理残留记录。')
  process.exit(0)
}

main()