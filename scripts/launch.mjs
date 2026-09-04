// ============================================================================
// 双陆棋 · 一键启动器（跨平台，Node 20+）
// 用法：node scripts/launch.mjs（或 SEA 打包后的 exe 双击）
//   1) 若 dist 未构建或源码更新，先执行 npm run build
//   2) 幂等：若已有本项目服务在跑（server.pid 且端口响应），直接打开浏览器
//   3) 否则在空闲端口启动 vite preview，写入 server.pid
//   4) 自动用默认浏览器打开主菜单
// 根目录由本文件位置推导（import.meta.dirname），不依赖 cwd。
// ============================================================================
import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const DIST = path.join(root, 'dist', 'index.html')
const BASE_PORT = 4173
const PID_FILE = path.join(root, 'server.pid')
const NO_OPEN = process.env.NO_OPEN === '1' // 供测试：不自动弹浏览器

/** 探测某 URL 是否已在响应（幂等判断用） */
async function ping(url, timeoutMs = 800) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    return res.ok
  } catch {
    return false
  }
}

// ---------- 0. 幂等：已有服务则直接打开 ----------
async function alreadyRunning() {
  if (!fs.existsSync(PID_FILE)) return false
  const pid = Number(fs.readFileSync(PID_FILE, 'utf8').trim())
  if (!Number.isInteger(pid) || pid <= 0) {
    fs.rmSync(PID_FILE, { force: true }) // 残留无效 pid，清理
    return false
  }
  // 端口是否真正响应（比 pid 探活更可靠）
  if (await ping(`http://127.0.0.1:${BASE_PORT}/`)) {
    return BASE_PORT
  }
  // pid 文件在但端口没起来：进程可能已死——清文件，走正常启动
  try {
    process.kill(pid, 0)
  } catch {
    fs.rmSync(PID_FILE, { force: true })
  }
  return false
}

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
  // 幂等：服务已在本机运行则直接打开浏览器
  const runningPort = await alreadyRunning()
  if (runningPort) {
    const url = `http://127.0.0.1:${runningPort}/`
    console.log(`[双陆棋] 服务已在运行：${url}`)
    openBrowser(url)
    process.exit(0)
  }

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
  console.error('[双陆棋] 启动失败：', err.message || err)
  process.exitCode = 1
}