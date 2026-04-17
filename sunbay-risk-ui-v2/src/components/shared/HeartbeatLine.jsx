import React, { useRef, useEffect } from 'react'

export default function HeartbeatLine({ delay = 0 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    let animId, startTime = null

    const beatInterval = 6000 // 6s between beats, same for all
    const beatDuration = 1200 // slow sweep
    const initialDelay = delay * 2000 // card 0: 0s, card 1: 2s, card 2: 4s — sequential top to bottom

    // ECG-like waveform: flat → small bump → big spike → dip → recovery → flat
    function ecgY(t) {
      // t: 0..1 progress through the beat
      if (t < 0.1) return 0                                    // flat
      if (t < 0.18) return Math.sin((t - 0.1) / 0.08 * Math.PI) * 2  // P wave (small bump)
      if (t < 0.28) return 0                                   // flat
      if (t < 0.33) return (t - 0.28) / 0.05 * -3             // Q dip
      if (t < 0.40) return -3 + (t - 0.33) / 0.07 * 15        // R spike (main peak)
      if (t < 0.47) return 12 - (t - 0.40) / 0.07 * 18        // S dip
      if (t < 0.55) return -6 + (t - 0.47) / 0.08 * 6         // recovery
      if (t < 0.70) return Math.sin((t - 0.55) / 0.15 * Math.PI) * 2.5 // T wave
      return 0                                                  // flat
    }

    const animate = (time) => {
      if (!startTime) startTime = time
      const elapsed = time - startTime

      const parent = canvas.parentElement
      const W = parent.offsetWidth
      const H = 20
      canvas.width = W * dpr; canvas.height = H * dpr
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const midY = H / 2

      const cycleElapsed = Math.max(0, elapsed - initialDelay)
      const cyclePos = (cycleElapsed % beatInterval) / beatInterval
      const beatProgress = cyclePos * beatInterval
      const pulseX = (cycleElapsed >= 0 && beatProgress < beatDuration)
        ? (beatProgress / beatDuration) * W
        : -1

      const style = getComputedStyle(document.documentElement)
      const primary = style.getPropertyValue('--primary').trim() || '#1890FF'
      const isDark = document.documentElement.getAttribute('data-theme')

      // Draw flat baseline
      ctx.save()
      ctx.globalAlpha = isDark ? 0.1 : 0.15
      ctx.strokeStyle = primary
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke()
      ctx.restore()

      // Draw the pulse waveform
      if (pulseX >= 0) {
        const pulseWidth = W * 0.35 // waveform occupies 35% of width
        const startX = pulseX - pulseWidth

        // Glow layer
        ctx.save()
        ctx.globalAlpha = 0.3
        ctx.strokeStyle = primary
        ctx.lineWidth = 1
        ctx.shadowColor = primary
        ctx.shadowBlur = 12
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'
        ctx.beginPath()
        for (let px = 0; px < W; px++) {
          const localT = (px - startX) / pulseWidth
          const y = (localT >= 0 && localT <= 1) ? midY - ecgY(localT) : midY
          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.restore()

        // Core layer (bright, thin)
        ctx.save()
        ctx.globalAlpha = 0.9
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 0.6
        ctx.shadowColor = primary
        ctx.shadowBlur = 6
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'
        ctx.beginPath()
        for (let px = 0; px < W; px++) {
          const localT = (px - startX) / pulseWidth
          const y = (localT >= 0 && localT <= 1) ? midY - ecgY(localT) : midY
          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.restore()

        // Leading dot (bright point at the front of the pulse)
        const dotLocalT = (pulseX - startX) / pulseWidth
        if (dotLocalT >= 0 && dotLocalT <= 1) {
          const dotY = midY - ecgY(dotLocalT)
          ctx.save()
          ctx.globalAlpha = 0.8
          ctx.fillStyle = '#fff'
          ctx.shadowColor = primary
          ctx.shadowBlur = 10
          ctx.beginPath(); ctx.arc(pulseX, dotY, 1.5, 0, Math.PI * 2); ctx.fill()
          ctx.restore()
        }

        // Fade trail behind the pulse
        ctx.save()
        const trailGrad = ctx.createLinearGradient(startX, 0, pulseX, 0)
        trailGrad.addColorStop(0, 'transparent')
        trailGrad.addColorStop(1, primary)
        ctx.globalAlpha = 0.15
        ctx.strokeStyle = trailGrad
        ctx.lineWidth = 0.5
        ctx.beginPath()
        for (let px = Math.max(0, Math.floor(startX)); px < pulseX; px++) {
          const localT = (px - startX) / pulseWidth
          const y = (localT >= 0 && localT <= 1) ? midY - ecgY(localT) : midY
          if (px === Math.max(0, Math.floor(startX))) ctx.moveTo(px, y); else ctx.lineTo(px, y)
        }
        ctx.stroke()
        ctx.restore()
      }

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [delay])

  return (
    <canvas ref={canvasRef}
      className="absolute bottom-0 left-0 pointer-events-none"
      style={{ width: '100%', height: 20 }} />
  )
}
