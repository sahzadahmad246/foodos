'use client'

import { useRouter } from 'next/navigation'
import { User, MapPin, Package, LogOut, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface ProfileSidebarProps {
    open: boolean
    onClose: () => void
    user: SupabaseUser
}

export function ProfileSidebar({ open, onClose, user }: ProfileSidebarProps) {
    const router = useRouter()
    const supabase = createClient()

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
                side="right"
                className="w-full sm:max-w-md p-0"
            >
                {/* User Info */}
                <div className="p-6 bg-muted/30">
                    <div className="flex items-center gap-4">
                        {user.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt={user.user_metadata?.full_name || 'User'}
                                className="h-16 w-16 rounded-full"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                                {user.user_metadata?.full_name || 'User'}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Menu Items */}
                <div className="p-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Button
                                key={item.href}
                                variant="ghost"
                                className="w-full justify-start gap-3 h-14 px-4"
                                onClick={() => {
                                    router.push(item.href)
                                    onClose()
                                }}
                            >
                                <Icon className="h-5 w-5 text-muted-foreground" />
                                <span className="flex-1 text-left">{item.label}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )
                    })}
                </div>

                <Separator />

                {/* Logout */}
                <div className="p-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-14 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="flex-1 text-left">Logout</span>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
