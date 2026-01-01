import { cn } from '@/lib/utils'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

function Avatar({ className, ...props }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 rounded-full', className)}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }) {
  return (
    <AvatarPrimitive.Image data-slot="avatar-image" className={cn('aspect-square size-full', className)} {...props} />
  )
}

function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }) {
  return (
    <div
      className={cn(
        '*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:overflow-hidden *:data-[slot=avatar]:ring-2',
        className,
      )}
      {...props}></div>
  )
}

export { Avatar, AvatarFallback, AvatarGroup, AvatarImage }
