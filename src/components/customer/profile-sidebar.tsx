'use client'

import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { User, MapPin, Package, LogOut, ChevronRight, X, Settings2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'

interface ProfileSidebarProps {
    open: boolean
    onClose: () => void
    user: SupabaseUser
}

function subscribeToDesktop(callback: () => void) {
    if (typeof window === 'undefined') return () => undefined

    const media = window.matchMedia('(min-width: 640px)')
    media.addEventListener('change', callback)
    return () => media.removeEventListener('change', callback)
}

function useIsDesktop() {
    return useSyncExternalStore(
        subscribeToDesktop,
        () => window.matchMedia('(min-width: 640px)').matches,
        () => false
    )
}

export function ProfileSidebar({ open, onClose, user }: ProfileSidebarProps) {
    const router = useRouter()
    const supabase = createClient()
    const isDesktop = useIsDesktop()
    const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Food lover'
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
    const initials = name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Logged out successfully')
        onClose()
        router.refresh()
    }

    const menuItems = [
        {
            icon: Package,
            label: 'My Orders',
            href: '/customer/orders',
        },
        {
            icon: MapPin,
            label: 'Saved Addresses',
            href: '/customer/addresses',
        },
        {
            icon: User,
            label: 'Profile',
            href: '/customer/profile',
        },
    ]

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent
                side={isDesktop ? 'right' : 'bottom'}
                className="flex h-[86dvh] w-full flex-col overflow-hidden rounded-t-3xl border-border/70 bg-background p-0 text-foreground sm:h-full sm:max-w-sm sm:rounded-none [&>button]:hidden"
            >
                <div className="border-b border-border/70 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <SheetTitle className="text-base font-semibold">Account</SheetTitle>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={onClose}
                            aria-label="Close profile menu"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                        <div className="h-16 bg-[radial-gradient(circle_at_12%_20%,hsl(var(--primary)/0.3),transparent_34%),linear-gradient(135deg,hsl(var(--primary)/0.13),hsl(var(--accent)/0.18),transparent)]" />
                        <div className="px-3 pb-4">
                            <div className="-mt-8 flex items-end gap-3">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-primary/15 text-lg font-bold text-primary">
                                    {avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                                    ) : (
                                        initials || <User className="h-6 w-6" />
                                    )}
                                </div>
                                <div className="min-w-0 pb-1">
                                    <h3 className="truncate text-lg font-bold tracking-tight">{name}</h3>
                                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-card">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.href}
                                    type="button"
                                    className={`flex h-12 w-full items-center gap-3 px-3 text-left text-sm transition hover:bg-muted/45 ${index > 0 ? 'border-t border-border/70' : ''}`}
                                    onClick={() => {
                                        router.push(item.href)
                                        onClose()
                                    }}
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="flex-1 font-medium">{item.label}</span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-4 rounded-2xl border border-border/70 bg-card p-3">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Settings2 className="h-4 w-4 text-primary" />
                            Theme
                        </div>
                        <ThemeToggle />
                    </div>
                </div>

                <div className="border-t border-border/70 bg-background px-3 py-3">
                    <Button
                        variant="outline"
                        className="h-11 w-full justify-start gap-3 rounded-xl border-destructive/25 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="flex-1 text-left">Logout</span>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
