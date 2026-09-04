// ============================================================================
// 双陆棋 · 停止后台预览服务（跨平台，Node 20+）
// 读取 server.pid，探活后精确结束该 PID（及其子进程树），不影响其它 node 进程。
// 根目录由本文件位置推导（import.meta 定位），不依赖 cwd。
// ============================================================================
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const PID_FILE = path.join(root, 'server.pid')

if (!fs.existsSync(PID_FILE)) {
  console.log('[双陆棋] 服务未在运行（没有 pid 文件）。')
  process.exit(0)
}

const pid = Number(fs.readFileSync(PID_FILE, 'utf8').trim())
if (!Number.isInteger(pid) || pid <= 0) {
  fs.rmSync(PID_FILE, { force: true })
  console.log('[双陆棋] pid 文件内容无效，已清理。')
  process.exit(0)
}

// 探活：进程不存在则视为已停止，清理即可
try {
  process.kill(pid, 0)
} catch {
  fs.rmSync(PID_FILE, { force: true })
  console.log('[双陆棋] 进程已不存在，清理 pid 文件。')
  process.exit(0)
}

try {
  if (process.platform === 'win32') {
    // 精确结束该 PID 及其进程树（/T），不影响其它 node 进程
    execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
  } else {
    // POSIX：先试进程本身（SIGTERM），再 SIGKILL 兜底
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        /* 可能已退出 */
      }
    }
  }
  fs.rmSync(PID_FILE, { force: true })
  console.log('[双陆棋] 服务已停止。')
} catch (err) {
  // PID 已不存在视为已停止
  fs.rmSync(PID_FILE, { force: true })
  console.log('[双陆棋] 服务已停止。')
}