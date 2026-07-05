import { cn } from "@/lib/utils"

// Avatar with initial-letter fallback. Pass sizing, font and fallback
// colors via className; the photo (when set) fills the same circle.
export function UserAvatar({
  name,
  avatar,
  className,
}: {
  name?: string | null
  avatar?: string | null
  className?: string
}) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name ?? ""}
        className={cn("rounded-full object-cover flex-shrink-0", className)}
      />
    )
  }
  return (
    <div className={cn("rounded-full flex items-center justify-center flex-shrink-0", className)}>
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  )
}
