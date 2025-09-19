import React, { useEffect, useRef } from "react"

export default function ChartMini({ data=[], color="#6366f1", height=80, max }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext("2d")
    const w = canvas.width = canvas.offsetWidth * devicePixelRatio
    const h = canvas.height = height * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0,0,w,h)
    const m = max ?? Math.max(1, ...data)
    const step = (canvas.offsetWidth-8) / Math.max(1, data.length-1)
    ctx.lineWidth = 2
    ctx.strokeStyle = color
    ctx.beginPath()
    data.forEach((v,i)=>{
      const x = 4 + i * step
      const y = height-4 - (v/m)*(height-8)
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
    })
    ctx.stroke()
    // gradient fill
    const grad = ctx.createLinearGradient(0,0,0,height)
    grad.addColorStop(0, color+"88")
    grad.addColorStop(1, color+"00")
    ctx.fillStyle = grad
    ctx.lineTo(4+(data.length-1)*step, height-4)
    ctx.lineTo(4, height-4)
    ctx.closePath(); ctx.fill()
  }, [data, color, height, max])
  return <canvas ref={ref} style={{ width: "100%", height }} className="rounded" />
}
