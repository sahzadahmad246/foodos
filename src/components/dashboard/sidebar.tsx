'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ClipboardList,
    UtensilsCrossed,
    Store,
    Users,
    Settings,
    Menu,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'

interface SidebarProps {
    restaurant: {
        id: string
        name: string
        logo_url: string | null
    }
}

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
    { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/dashboard/outlet', label: 'My Outlet', icon: Store },
    { href: '/dashboard/riders', label: 'Riders', icon: Users },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ restaurant, onItemClick }: SidebarProps & { onItemClick?: () => void }) {
    const pathname = usePathname()

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b px-6 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                    {restaurant.name[0]}
                </div>
                <span className="font-semibold truncate">{restaurant.name}</span>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1">
                <nav className="space-y-1 p-4">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onItemClick}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4 shrink-0">
                <p className="text-xs text-muted-foreground">
                    Powered by foodOS
                </p>
            </div>
        </div>
    )
}

// Desktop Sidebar
export function DashboardSidebar({ restaurant }: SidebarProps) {
    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-background fixed inset-y-0 left-0 z-30">
            <SidebarContent restaurant={restaurant} />
        </aside>
    )
}

// Mobile Sidebar
export function MobileSidebar({ restaurant }: SidebarProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <SidebarContent restaurant={restaurant} onItemClick={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    )
}

// Get page title from pathname
export function getPageTitle(pathname: string): string {
    const item = menuItems.find(item =>
        pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(item.href))
    )
    return item?.label || 'Dashboard'
}
