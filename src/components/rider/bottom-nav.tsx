'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Banknote, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
    { href: '/rider', label: 'Home', icon: Home },
    { href: '/rider/cash', label: 'Cash', icon: Banknote },
    { href: '/rider/orders', label: 'Orders', icon: ClipboardList },
]

function isActive(pathname: string, href: string) {
    if (href === '/rider') return pathname === '/rider'
    return pathname.startsWith(href)
}

export function RiderBottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex h-16 w-full max-w-lg items-center justify-around px-3">
                {items.map((item) => {
                    const active = isActive(pathname, item.href)
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex min-w-20 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
