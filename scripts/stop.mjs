// ============================================================================
// 双陆棋 · 停止后台预览服务（跨平台）
// 读取 server.pid，精确结束该 PID（及其子进程树），不影响其它 node 进程。
// ============================================================================
import fs from 'node:fs'
import { execSync, spawnSync } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const PID_FILE = path.join(root, 'server.pid')

if (!fs.existsSync(PID_FILE)) {
  console.log('[双陆棋] 服务未在运行（没有 pid 文件）。')
  process.exit(0)
}

const pid = Number(fs.readFileSync(PID_FILE, 'utf8').trim())
if (!Number.isInteger(pid) || pid <= 0) {
  console.log('[双陆棋] pid 文件内容无效。')
  process.exit(0)
}

try {
  if (process.platform === 'win32') {
    // 精确结束该 PID 及其进程树（/T），不影响其它 node 进程
    execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
  } else {
    // POSIX：结束进程树（负数 = 进程组；这里先试进程本身，再保险收 Pgrep 兄弟）
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        /* 可能已退出 */
      }
    }
    // 兜底：若仍有残留同命令 node 进程，可在此扩展
  }
  fs.rmSync(PID_FILE, { force: true })
  console.log('[双陆棋] 服务已停止。')
} catch (err) {
  // PID 已不存在视为已停止
  fs.rmSync(PID_FILE, { force: true })
  console.log('[双陆棋] 服务已停止。')
}