"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({ open: false, onOpenChange: () => {} })

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      const close = () => setOpen(false)
      document.addEventListener("click", close, { capture: true, once: true })
      return () => document.removeEventListener("click", close, { capture: true })
    }
  }, [open])
  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  const { onOpenChange, open } = React.useContext(DropdownMenuContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); onOpenChange(!open) }
    })
  }
  return <span onClick={(e) => { e.stopPropagation(); onOpenChange(!open) }}>{children}</span>
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }>(
  ({ className, align = "start", ...props }, ref) => {
    const { open } = React.useContext(DropdownMenuContext)
    if (!open) return null
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md top-full mt-1",
          align === "end" ? "right-0" : "left-0",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      />
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DropdownMenuContext)
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    )
  }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  )
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
  )
)
DropdownMenuLabel.displayName = "DropdownMenuLabel"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel }
