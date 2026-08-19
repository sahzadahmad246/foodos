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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'

interface SidebarProps {
    restaurant: { id: string; name: string; logo_url: string | null }
}

const menuItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
    { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/dashboard/outlet', label: 'My Outlet', icon: Store },
    { href: '/dashboard/riders', label: 'Riders', icon: Users },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ restaurant, onItemClick }: SidebarProps & { onItemClick?: () => void }) {
    const pathname = usePathname()

    return (
        <div className="flex h-full flex-col bg-[#101715] text-[#f7f4ec]">
            <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-6 py-6">
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-[#d7f36b] font-serif text-xl font-bold text-[#101715]">
                    {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" className="size-full object-cover" /> : restaurant.name[0]}
                </div>
                <div className="min-w-0">
                    <p className="font-serif text-lg leading-tight">foodOS</p>
                    <p className="truncate text-xs text-white/45">{restaurant.name}</p>
                </div>
            </div>
            <div className="px-6 pb-3 pt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Workspace</div>
            <ScrollArea className="flex-1">
                <nav className="flex flex-col gap-1 px-3">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                        return (
                            <Link key={item.href} href={item.href} onClick={onItemClick} className={cn('group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all', isActive ? 'bg-[#d7f36b] font-semibold text-[#101715]' : 'text-white/58 hover:bg-white/7 hover:text-white')}>
                                <item.icon className={cn('size-4', isActive ? 'text-[#101715]' : 'text-white/45 group-hover:text-[#d7f36b]')} />
                                {item.label}
                                {isActive && <span className="ml-auto size-1.5 rounded-full bg-[#f07f68]" />}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>
            <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium text-white/75">Your restaurant hub</p>
                <p className="mt-1 text-xs leading-5 text-white/40">Manage the details that keep service moving.</p>
            </div>
            <div className="border-t border-white/10 px-6 py-4 text-[10px] uppercase tracking-[0.18em] text-white/30">Powered by foodOS</div>
        </div>
    )
}

export function DashboardSidebar({ restaurant }: SidebarProps) {
    return <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 md:flex"><SidebarContent restaurant={restaurant} /></aside>
}

export function MobileSidebar({ restaurant }: SidebarProps) {
    const [open, setOpen] = useState(false)
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-foreground md:hidden"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="w-64 border-white/10 bg-[#101715] p-0"><SidebarContent restaurant={restaurant} onItemClick={() => setOpen(false)} /></SheetContent>
        </Sheet>
    )
}

export function getPageTitle(pathname: string): string {
    const item = menuItems.find(item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
    return item?.label || 'Overview'
}
