// ============================================================================
// 双陆棋 · 一键启动器（Windows）
// 用法：双击「启动双陆棋.vbs」→ 本脚本自动：
//   1) 若 dist 未构建，先执行 npm run build
//   2) 在空闲端口启动 vite preview（静态服务构建产物，无需编译、秒开）
//   3) 自动用默认浏览器打开游戏页
//   4) 把服务 PID 写入 server.pid（供「停止双陆棋.vbs」使用）
// ============================================================================
import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import net from 'node:net'

const root = process.cwd()
const DIST = path.join(root, 'dist', 'index.html')
const BASE_PORT = 4173
const PID_FILE = path.join(root, 'server.pid')
const NO_OPEN = process.env.NO_OPEN === '1' // 供测试：不自动弹浏览器

// ---------- 1. 构建（仅在缺失或源码更新时） ----------
function ensureBuild() {
  if (!fs.existsSync(DIST)) {
    console.log('[双陆棋] 首次启动：正在构建（约几秒）…')
    execSync('npm run build', { stdio: 'inherit', cwd: root })
  } else {
    // 源码比构建产物新 → 也重新构建，保证玩法最新
    const srcNewer = ['src', 'index.html', 'vite.config.ts'].some((p) => {
      const pth = path.join(root, p)
      if (!fs.existsSync(pth)) return false
      let newest = 0
      const walk = (dir) => {
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f)
          const st = fs.statSync(full)
          if (st.isDirectory()) walk(full)
          else newest = Math.max(newest, st.mtimeMs)
        }
      }
      try {
        if (fs.statSync(pth).isDirectory()) walk(pth)
        else newest = fs.statSync(pth).mtimeMs
      } catch {
        /* ignore */
      }
      return newest > fs.statSync(DIST).mtimeMs
    })
    if (srcNewer) {
      console.log('[双陆棋] 检测到源码更新，重新构建…')
      execSync('npm run build', { stdio: 'inherit', cwd: root })
    }
  }
}

// ---------- 2. 找空闲端口 ----------
function findPort(start) {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', () => {
      // 占用则 +1 重试
      srv.close(() => resolve(findPort(start + 1)))
    })
    srv.listen(start, '127.0.0.1', () => {
      const port = start
      srv.close(() => resolve(port))
    })
    setTimeout(() => reject(new Error('端口探测超时')), 5000)
  })
}

// ---------- 3. 轮询直到服务可访问 ----------
async function waitReady(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('服务启动超时')
}

// ---------- 4. 打开浏览器 ----------
function openBrowser(url) {
  if (NO_OPEN) return
  try {
    execSync(`start "" "${url}"`, { stdio: 'ignore', shell: 'cmd.exe' })
  } catch {
    /* 忽略打开失败 */
  }
}

// ---------- 主流程 ----------
try {
  ensureBuild()
  const port = await findPort(BASE_PORT)
  const url = `http://127.0.0.1:${port}/`

  // 直接以 node 运行 vite preview（PID 即服务进程，可被 stop 脚本精确结束）
  // detached: true → 独立进程组，父进程（node launch）退出后服务依然存活
  const child = spawn(
    process.execPath,
    [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], windowsHide: true, detached: true },
  )
  child.unref()

  fs.writeFileSync(PID_FILE, String(child.pid), 'utf8')

  await waitReady(url)
  console.log(`[双陆棋] 已启动：${url}`)
  openBrowser(url)
} catch (err) {
  console.error('[双陆棋] 启动失败：', err)
  process.exitCode = 1
}