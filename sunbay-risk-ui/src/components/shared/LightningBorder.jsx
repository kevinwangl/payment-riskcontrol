import React, { useRef, useEffect } from 'react'

// Midpoint displacement fractal bolt between two points
function fractalBolt(x1, y1, x2, y2, displace, depth = 5) {
  if (depth === 0) return [{ x: x1, y: y1 }, { x: x2, y: y2 }]
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * displace
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * displace
  const left = fractalBolt(x1, y1, mx, my, displace * 0.55, depth - 1)
  const right = fractalBolt(mx, my, x2, y2, displace * 0.55, depth - 1)
  return [...left.slice(0, -1), ...right]
}

// Point on rectangle perimeter, t in [0,1]
function perimPt(t, w, h) {
  const p = 2 * (w + h)
  let d = ((t % 1) + 1) % 1 * p
  if (d < w) return { x: d, y: 0 }
  d -= w; if (d < h) return { x: w, y: d }
  d -= h; if (d < w) return { x: w - d, y: h }
  d -= w; return { x: 0, y: h - d }
}

// Generate main bolt along border segment with fractal jitter
function generateMainBolt(t, w, h, jitterScale = 12, boltLen = 0.25) {
  const steps = 24
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const frac = t + (boltLen * i) / steps
    const pt = perimPt(frac, w, h)
    const next = perimPt(frac + 0.001, w, h)
    const dx = next.x - pt.x, dy = next.y - pt.y
    const l = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = -dy / l, ny = dx / l
    const jitter = (Math.random() - 0.5) * jitterScale
    pts.push({ x: pt.x + nx * jitter, y: pt.y + ny * jitter })
  }
  return pts
}

// Generate branches from main bolt
function generateBranches(mainPts, count) {
  const branches = []
  for (let b = 0; b < count; b++) {
    const idx = Math.floor(Math.random() * (mainPts.length - 2)) + 1
    const o = mainPts[idx]
    const angle = Math.random() * Math.PI * 2
    const bLen = 10 + Math.random() * 18
    const end = { x: o.x + Math.cos(angle) * bLen, y: o.y + Math.sin(angle) * bLen }
    branches.push(fractalBolt(o.x, o.y, end.x, end.y, 8, 3))
  }
  return branches
}

// Draw a bolt path with glow + core
function drawPath(ctx, pts, coreW, glowW, color, coreColor, alpha) {
  if (pts.length < 2) return
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); }

  // Glow
  ctx.save()
  ctx.globalAlpha = alpha * 0.35
  ctx.strokeStyle = color; ctx.lineWidth = glowW; ctx.shadowColor = color; ctx.shadowBlur = 20
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  path(); ctx.stroke()
  ctx.restore()

  // Core
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = coreColor; ctx.lineWidth = coreW; ctx.shadowColor = color; ctx.shadowBlur = 10
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  path(); ctx.stroke()
  ctx.restore()
}

// Flash the entire border briefly
function drawFlash(ctx, w, h, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.shadowColor = '#4A9EFF'
  ctx.shadowBlur = 24
  ctx.strokeRect(0, 0, w, h)
  ctx.restore()
}

export default function LightningBorder({ scale = 1 }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    phase: 'quiet',
    timer: 0,
    strikeT: Math.random(),
    strikeCount: 0,
    strikeAlpha: 0,
    flashAlpha: 0,
    quietDuration: 2000 + Math.random() * 3000, // 2-5s between strikes
    sparkTimer: 0,
    sparks: [],
    // Per-instance random variation
    jitterScale: 8 + Math.random() * 10,      // bolt jaggedness: 8-18
    branchCount: 2 + Math.floor(Math.random() * 4), // 2-5 branches
    boltLen: 0.15 + Math.random() * 0.2,      // 15-35% of perimeter
    restrikeInterval: 100 + Math.random() * 80, // 100-180ms between re-strikes
    goldRatio: 0.38 + Math.random() * 0.24,   // gold/blue mix: 0.38-0.62 (golden ratio zone)
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    const ctx = canvas.getContext('2d')
    let animId, lastTime = 0

    const animate = (time) => {
      const dt = lastTime ? Math.min(time - lastTime, 50) : 16
      lastTime = time
      const s = stateRef.current

      const w = parent.offsetWidth
      const h = parent.offsetHeight
      canvas.width = w + 40
      canvas.height = h + 40
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(20, 20)

      s.timer += dt

      // === State machine ===
      if (s.phase === 'quiet') {
        // Occasional tiny pre-sparks
        s.sparkTimer += dt
        if (s.sparkTimer > 300 + Math.random() * 500) {
          s.sparkTimer = 0
          const st = Math.random()
          const p = perimPt(st, w, h)
          s.sparks.push({ x: p.x, y: p.y, life: 1 })
        }

        // Draw pre-sparks
        s.sparks = s.sparks.filter(sp => {
          sp.life -= dt * 0.005 // slower fade
          if (sp.life <= 0) return false
          ctx.save()
          ctx.globalAlpha = sp.life * 0.6
          ctx.fillStyle = '#FFD866'
          ctx.shadowColor = '#4A9EFF'
          ctx.shadowBlur = 6
          ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2)
          ctx.restore()
          return true
        })

        // Transition to strike
        if (s.timer > s.quietDuration) {
          s.phase = 'strike'
          s.timer = 0
          s.strikeT = Math.random()
          s.strikeCount = 0
          s.strikeAlpha = 1
          s.flashAlpha = 0.6
        }
      }

      else if (s.phase === 'strike') {
        const newCount = Math.floor(s.timer / s.restrikeInterval)

        if (newCount > s.strikeCount && newCount <= 3) {
          s.strikeCount = newCount
          s.strikeAlpha = [1, 0.7, 0.4][Math.min(s.strikeCount - 1, 2)]
          s.flashAlpha = [0.5, 0.3, 0.15][Math.min(s.strikeCount - 1, 2)]
        }

        // Generate bolt with per-instance params
        const main = generateMainBolt(s.strikeT, w, h, s.jitterScale * scale, s.boltLen)
        const branches = generateBranches(main, s.branchCount)

        // Environment flash
        if (s.flashAlpha > 0) {
          drawFlash(ctx, w, h, s.flashAlpha)
          s.flashAlpha *= 0.88
        }

        // Gold/blue ratio mix: interpolate glow and core colors
        const gr = s.goldRatio
        const glowColor = `rgb(${Math.round(74 + 181 * gr)}, ${Math.round(158 + 58 * gr)}, ${Math.round(255 - 153 * gr)})` // blue→gold
        const coreColor = `rgb(${Math.round(255)}, ${Math.round(232 - 72 * (1 - gr))}, ${Math.round(160 - 60 * (1 - gr))})`

        // Main bolt
        drawPath(ctx, main, 2 * scale, 8 * scale, glowColor, coreColor, s.strikeAlpha)
        drawPath(ctx, main, 0.8 * scale, 2 * scale, '#fff', '#fff', s.strikeAlpha * 0.8)

        // Branches
        branches.forEach(br => {
          drawPath(ctx, br, 1 * scale, 4 * scale, glowColor, '#FFD866', s.strikeAlpha * 0.5)
        })

        if (s.timer > s.restrikeInterval * 3 + 50) {
          s.phase = 'decay'
          s.timer = 0
          s.strikeAlpha = 0.3
        }
      }

      else if (s.phase === 'decay') {
        s.strikeAlpha -= dt * 0.002 // slower decay
        if (s.strikeAlpha > 0) {
          const main = generateMainBolt(s.strikeT, w, h, s.jitterScale * scale, s.boltLen)
          const gr = s.goldRatio
          const glowColor = `rgb(${Math.round(74 + 181 * gr)}, ${Math.round(158 + 58 * gr)}, ${Math.round(255 - 153 * gr)})`
          drawPath(ctx, main, 1 * scale, 4 * scale, glowColor, '#FFD866', s.strikeAlpha)
        }
        if (s.strikeAlpha <= 0 || s.timer > 500) {
          s.phase = 'quiet'
          s.timer = 0
          s.quietDuration = 2000 + Math.random() * 3000
          s.sparks = []
        }
      }

      ctx.restore()
      animId = requestAnimationFrame(animate)
    }

    // Random start offset so cards don't sync
    stateRef.current.timer = Math.random() * 2000
    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas ref={canvasRef}
      className="absolute pointer-events-none"
      style={{ top: -20, left: -20, width: 'calc(100% + 40px)', height: 'calc(100% + 40px)' }} />
  )
}
