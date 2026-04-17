import React, { useRef, useEffect } from 'react'

// Fractal bolt between two points
function fractalBolt(x1, y1, x2, y2, displace, depth = 5) {
  if (depth === 0) return [{ x: x1, y: y1 }, { x: x2, y: y2 }]
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * displace
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * displace
  const left = fractalBolt(x1, y1, mx, my, displace * 0.55, depth - 1)
  const right = fractalBolt(mx, my, x2, y2, displace * 0.55, depth - 1)
  return [...left.slice(0, -1), ...right]
}

// Generate vertical bolt with many fine branches
function generateStrike(h, x) {
  const startY = Math.random() * h * 0.3
  const endY = startY + h * (0.25 + Math.random() * 0.35)
  const main = fractalBolt(x, startY, x, endY, 8, 7) // tighter bends, more detail

  const branches = []
  const count = 4 + Math.floor(Math.random() * 5) // 4-8 branches
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * (main.length - 2)) + 1
    const o = main[idx]
    const angle = (Math.random() > 0.5 ? -1 : 1) * (0.3 + Math.random() * 1.0)
    const bLen = 6 + Math.random() * 16
    const end = { x: o.x + Math.cos(angle) * bLen, y: o.y + Math.sin(angle) * bLen + bLen * 0.5 }
    const branch = fractalBolt(o.x, o.y, end.x, end.y, 5, 4)
    branches.push(branch)
    // Sub-branches (capillary effect)
    if (Math.random() > 0.5 && branch.length > 3) {
      const si = Math.floor(Math.random() * (branch.length - 1)) + 1
      const so = branch[si]
      const sa = (Math.random() - 0.5) * 2
      const sl = 3 + Math.random() * 8
      branches.push(fractalBolt(so.x, so.y, so.x + Math.cos(sa) * sl, so.y + Math.sin(sa) * sl + sl * 0.3, 3, 3))
    }
  }
  return { main, branches }
}

function drawPath(ctx, pts, coreW, glowW, glowColor, coreColor, alpha) {
  if (pts.length < 2) return
  const draw = () => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y) }

  // Layer 1: wide outer glow (blue-purple haze)
  ctx.save(); ctx.globalAlpha = alpha * 0.2; ctx.strokeStyle = glowColor; ctx.lineWidth = 1.5
  ctx.shadowColor = glowColor; ctx.shadowBlur = 35; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  draw(); ctx.stroke(); draw(); ctx.stroke(); draw(); ctx.stroke() // triple pass
  ctx.restore()

  // Layer 2: mid glow (orange-gold)
  ctx.save(); ctx.globalAlpha = alpha * 0.5; ctx.strokeStyle = coreColor; ctx.lineWidth = 1
  ctx.shadowColor = coreColor; ctx.shadowBlur = 16; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  draw(); ctx.stroke()
  ctx.restore()

  // Layer 3: bright core (white-gold, hair thin)
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.6
  ctx.shadowColor = coreColor; ctx.shadowBlur = 8; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  draw(); ctx.stroke()
  ctx.restore()
}

export default function LightningSeam() {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    phase: 'quiet', timer: 0, strikeCount: 0, strikeAlpha: 0, flashAlpha: 0,
    quietDuration: 1500 + Math.random() * 2500,
    restrikeInterval: 100 + Math.random() * 80,
    goldRatio: 0.38 + Math.random() * 0.24,
    sparkTimer: 0, sparks: [],
    strike: null,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, lastTime = 0

    const animate = (time) => {
      const dt = lastTime ? Math.min(time - lastTime, 50) : 16
      lastTime = time
      const s = stateRef.current

      const dpr = window.devicePixelRatio || 1
      const W = 40, H = window.innerHeight
      canvas.width = W * dpr; canvas.height = H * dpr
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

    // Theme-aware colors
    const isDark = document.documentElement.getAttribute('data-theme')
    const baseGlow = isDark ? '#4A9EFF' : '#1a6dd4'
    const baseGold = isDark ? '#FFD866' : '#d4940a'
    const baseLine = isDark ? '#4A9EFF' : '#2a7fff'
    const glowBlur = isDark ? 24 : 16
    const coreAlphaBoost = isDark ? 1 : 1.4
      const cx = W * 0.5 // bolt center, middle of canvas
      s.timer += dt

      // Dim base glow line
      ctx.save()
      ctx.globalAlpha = isDark ? 0.06 : 0.15
      const grad = ctx.createLinearGradient(cx, 0, cx, H)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(0.2, baseLine)
      grad.addColorStop(0.8, baseLine)
      grad.addColorStop(1, 'transparent')
      ctx.strokeStyle = grad; ctx.lineWidth = 0.5; ctx.shadowColor = baseLine; ctx.shadowBlur = 4
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()
      ctx.restore()

      if (s.phase === 'quiet') {
        // Pre-sparks
        s.sparkTimer += dt
        if (s.sparkTimer > 250 + Math.random() * 500) {
          s.sparkTimer = 0
          s.sparks.push({ x: cx + (Math.random() - 0.5) * 6, y: Math.random() * H, life: 1 })
        }
        s.sparks = s.sparks.filter(sp => {
          sp.life -= dt * 0.004
          if (sp.life <= 0) return false
          ctx.save(); ctx.globalAlpha = sp.life * 0.7
          ctx.fillStyle = baseGold; ctx.shadowColor = baseLine; ctx.shadowBlur = 8
          ctx.fillRect(sp.x - 1.5, sp.y - 1.5, 3, 3); ctx.restore()
          return true
        })

        if (s.timer > s.quietDuration) {
          s.phase = 'strike'; s.timer = 0; s.strikeCount = 0
          s.strikeAlpha = 1; s.flashAlpha = 0.5
          s.strike = generateStrike(H, cx)
        }
      }

      else if (s.phase === 'strike') {
        const newCount = Math.floor(s.timer / s.restrikeInterval)
        if (newCount > s.strikeCount && newCount <= 3) {
          s.strikeCount = newCount
          s.strikeAlpha = [1, 0.7, 0.4][Math.min(s.strikeCount - 1, 2)]
          s.flashAlpha = [0.4, 0.25, 0.1][Math.min(s.strikeCount - 1, 2)]
          s.strike = generateStrike(H, cx) // re-generate for flicker
        }

        // Environment flash — whole seam lights up
        if (s.flashAlpha > 0) {
          ctx.save(); ctx.globalAlpha = s.flashAlpha
          ctx.strokeStyle = isDark ? '#fff' : baseLine; ctx.lineWidth = isDark ? 4 : 5; ctx.shadowColor = baseLine; ctx.shadowBlur = 30
          ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke(); ctx.restore()
          s.flashAlpha *= 0.86
        }

        const gr = s.goldRatio
        const glowC = isDark
          ? `rgb(${Math.round(74 + 181 * gr)},${Math.round(158 + 58 * gr)},${Math.round(255 - 153 * gr)})`
          : `rgb(${Math.round(20 + 160 * gr)},${Math.round(80 + 60 * gr)},${Math.round(220 - 120 * gr)})`
        const coreC = isDark
          ? `rgb(255,${Math.round(232 - 72 * (1 - gr))},${Math.round(160 - 60 * (1 - gr))})`
          : `rgb(${Math.round(200 + 55 * gr)},${Math.round(160 - 40 * (1 - gr))},${Math.round(20 + 40 * gr)})`

        if (s.strike) {
          const a = Math.min(s.strikeAlpha * coreAlphaBoost, 1)
          drawPath(ctx, s.strike.main, 0, 0, glowC, coreC, a)
          s.strike.branches.forEach(br => {
            drawPath(ctx, br, 0, 0, glowC, baseGold, a * 0.4)
          })
        }

        if (s.timer > s.restrikeInterval * 3 + 60) {
          s.phase = 'decay'; s.timer = 0; s.strikeAlpha = 0.3
        }
      }

      else if (s.phase === 'decay') {
        s.strikeAlpha -= dt * 0.0018
        if (s.strikeAlpha > 0 && s.strike) {
          const gr = s.goldRatio
          const glowC = isDark
            ? `rgb(${Math.round(74 + 181 * gr)},${Math.round(158 + 58 * gr)},${Math.round(255 - 153 * gr)})`
            : `rgb(${Math.round(20 + 160 * gr)},${Math.round(80 + 60 * gr)},${Math.round(220 - 120 * gr)})`
          const dying = generateStrike(H, cx)
          drawPath(ctx, dying.main, 0, 0, glowC, baseGold, Math.min(s.strikeAlpha * coreAlphaBoost, 1))
        }
        if (s.strikeAlpha <= 0 || s.timer > 600) {
          s.phase = 'quiet'; s.timer = 0
          s.quietDuration = 1500 + Math.random() * 2500
          s.sparks = []; s.strike = null
        }
      }

      animId = requestAnimationFrame(animate)
    }

    stateRef.current.timer = Math.random() * 2000
    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas ref={canvasRef}
      className="absolute right-0 top-0 pointer-events-none"
      style={{ width: 40, height: '100%' }} />
  )
}
