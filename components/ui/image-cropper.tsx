"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, Move } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface ImageCropperProps {
  file: File
  /** Target aspect ratio as width / height (1 = square, 3 = wide banner). */
  aspect: number
  /** Output image width in pixels; height is derived from aspect. */
  outputWidth: number
  /** Round the preview viewport corners (cosmetic only). */
  rounded?: boolean
  title?: string
  onCancel: () => void
  onCropped: (blob: Blob) => void
}

const MAX_ZOOM = 3

// Interactive crop dialog: drag to reposition, slider to zoom, and the
// viewport shows exactly the region that will be saved (cover-fit).
export function ImageCropper({ file, aspect, outputWidth, rounded, title, onCancel, onCropped }: ImageCropperProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const [src, setSrc] = useState<string>("")
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [vp, setVp] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)
  const [exporting, setExporting] = useState(false)

  const drag = useRef<{ x: number; y: number } | null>(null)

  // Object URL for the selected file
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Track the rendered viewport size (responsive)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => setVp({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ready])

  // Scale needed so the image always covers the viewport at zoom = 1
  const coverScale = natural && vp.w > 0 && vp.h > 0
    ? Math.max(vp.w / natural.w, vp.h / natural.h)
    : 1
  const scale = coverScale * zoom
  const dw = natural ? natural.w * scale : 0
  const dh = natural ? natural.h * scale : 0

  const clamp = useCallback((x: number, y: number) => {
    const minX = Math.min(0, vp.w - dw)
    const minY = Math.min(0, vp.h - dh)
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    }
  }, [vp.w, vp.h, dw, dh])

  // Center the image once we know both natural + viewport sizes
  useEffect(() => {
    if (!natural || vp.w === 0 || vp.h === 0) return
    setOffset(clamp((vp.w - dw) / 2, (vp.h - dh) / 2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural, vp.w, vp.h])

  // Re-clamp when zoom changes, keeping the viewport center stable
  const handleZoom = (nextZoom: number) => {
    const oldScale = scale
    const newScale = coverScale * nextZoom
    setOffset((o) => {
      const ratio = newScale / oldScale
      const nx = vp.w / 2 - (vp.w / 2 - o.x) * ratio
      const ny = vp.h / 2 - (vp.h / 2 - o.y) * ratio
      const ndw = (natural?.w ?? 0) * newScale
      const ndh = (natural?.h ?? 0) * newScale
      const minX = Math.min(0, vp.w - ndw)
      const minY = Math.min(0, vp.h - ndh)
      return {
        x: Math.min(0, Math.max(minX, nx)),
        y: Math.min(0, Math.max(minY, ny)),
      }
    })
    setZoom(nextZoom)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setOffset((o) => clamp(o.x + dx, o.y + dy))
  }
  const onPointerUp = () => { drag.current = null }

  const handleConfirm = () => {
    const img = imgRef.current
    if (!img || !natural) return
    setExporting(true)
    try {
      const outW = outputWidth
      const outH = Math.round(outputWidth / aspect)
      const sx = -offset.x / scale
      const sy = -offset.y / scale
      const sW = vp.w / scale
      const sH = vp.h / scale

      const canvas = document.createElement("canvas")
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext("2d")
      if (!ctx) { setExporting(false); return }
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, sx, sy, sW, sH, 0, 0, outW, outH)
      canvas.toBlob(
        (blob) => {
          setExporting(false)
          if (blob) onCropped(blob)
        },
        "image/jpeg",
        0.9
      )
    } catch {
      setExporting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title ?? "Обрізати зображення"}</DialogTitle>
        </DialogHeader>

        <div
          ref={viewportRef}
          className={`relative w-full overflow-hidden bg-gray-900 select-none touch-none cursor-move ${rounded ? "rounded-2xl" : "rounded-xl"}`}
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget
                setNatural({ w: el.naturalWidth, h: el.naturalHeight })
                setReady(true)
              }}
              className="absolute max-w-none pointer-events-none"
              style={{ width: dw || undefined, height: dh || undefined, left: offset.x, top: offset.y }}
            />
          )}
          {/* Framing hint */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-white/20" />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--accent-600)]"
            aria-label="Масштаб"
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-gray-400 -mt-2">
          <Move className="w-3 h-3" /> Перетягніть, щоб відкадрувати
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={exporting}>Скасувати</Button>
          <Button onClick={handleConfirm} disabled={!ready || exporting} className="bg-sky-custom hover:bg-sky-dark text-sky-darker hover:text-white">
            {exporting ? "Обробка..." : "Застосувати"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
