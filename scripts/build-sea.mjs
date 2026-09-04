// ============================================================================
// 双陆棋 · Node SEA 打包脚本（单文件离线可玩，无需本机 Node）
// 用法：node scripts/build-sea.mjs
// 产出（dist-app/）：
//   双陆棋.exe（Windows）/ 双陆棋（macOS/Linux）   —— 双击启动（内置 HTTP 服务 + 内嵌静态资源）
//   停止双陆棋.exe / 停止双陆棋                    —— 双击优雅停止
// 流程：npm run build → make-sea-assets → SEA blob → postject 注入 → 清理
// 依赖：Node >= 20.12；运行时无需 Node、无需 node_modules、无需 dist。
// ============================================================================
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'dist-app')
const EXE = process.platform === 'win32' ? '.exe' : ''
const startName = `双陆棋${EXE}`

// 1) 保证 postject
if (!fs.existsSync(path.join(root, 'node_modules', 'postject'))) {
  console.log('[SEA] 安装 postject…')
  spawnSync('npm', ['i', '-D', 'postject'], { cwd: root, stdio: 'inherit' })
  if (!fs.existsSync(path.join(root, 'node_modules', 'postject'))) {
    console.error('[SEA] postject 安装失败'); process.exit(1)
  }
}

// 2) 构建 + 生成内嵌资源
console.log('[SEA] 构建 + 生成资源映射…')
// Windows 上 npm 是 .cmd，spawnSync 需 shell: true；Node 直接执行不需
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
let b = spawnSync(npmCmd, ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
if (b.status !== 0) { console.error('[SEA] build 失败'); process.exit(1) }
b = spawnSync(process.execPath, [path.join(__dirname, 'make-sea-assets.mjs')], { cwd: root, stdio: 'inherit' })
if (b.status !== 0) { console.error('[SEA] make-sea-assets 失败'); process.exit(1) }

fs.mkdirSync(outDir, { recursive: true })
const postject = path.join(root, 'node_modules', 'postject', 'dist', 'cli.js')
const FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'

/** 为某个入口打包一个 SEA 可执行文件 */
function buildOne(mainFile, outputName) {
  console.log(`[SEA] 打包 ${outputName} ← ${mainFile} …`)
  const blobFile = path.join(outDir, '.blob')
  const sig = path.join(outDir, '.sig')
  const cfg = path.join(outDir, '.cfg.json')
  fs.writeFileSync(cfg, JSON.stringify({
    main: mainFile,
    output: blobFile,
    disableExperimentalSEAWarning: true,
  }, null, 2), 'utf8')

  const blob = spawnSync(process.execPath, ['--experimental-sea-config', cfg], { cwd: root, stdio: 'inherit' })
  if (blob.status !== 0) { console.error('[SEA] blob 生成失败'); process.exit(1) }

  const target = path.join(outDir, outputName)
  fs.copyFileSync(process.execPath, target)
  // postject 注入（--sentinel-fuse 兼容 v1）
  const inject = spawnSync(
    process.execPath,
    [postject, target, 'NODE_SEA_BLOB', blobFile, '--sentinel-fuse', FUSE],
    { cwd: root, stdio: 'inherit' },
  )
  if (inject.status !== 0) { console.error('[SEA] 注入失败'); process.exit(1) }

  fs.rmSync(blobFile, { force: true })
  fs.rmSync(sig, { force: true })
  fs.rmSync(cfg, { force: true })
  console.log(`[SEA] ✓ ${target}`)
}

// 复制 SEA 入口到 dist-app（sea-app.cjs 已在 make-sea-assets 中内联资源映射）
// 单 exe 方案：只打包启动 exe（停止通过页面按钮 / 关闭浏览器自动退出，无需第二个 exe）
buildOne(path.join(outDir, 'sea-app.cjs'), startName)

// 清理包内中间文件（sea-assets.cjs 保留以便重复构建；入口副本留在 dist-app）
console.log('[SEA] 完成。')
console.log(`[SEA] 启动：${path.join(outDir, startName)}`)
console.log('[SEA] 提示：dist-app/ 为打包产物（gitignore），exe 可整体拷到任意文件夹使用')
console.log('[SEA] 停止：游戏主菜单「退出本地服务」按钮，或直接关闭浏览器（自动退出）')