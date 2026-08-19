import type React from 'react'
import type { LucideIcon } from 'lucide-react'

interface RiderSectionProps {
    icon: LucideIcon
    title: string
    subtitle?: string
    children: React.ReactNode
    glow?: string
    action?: React.ReactNode
}

export function RiderSection({
    icon: Icon,
    title,
    subtitle,
    children,
    glow = 'rgba(96, 165, 250, 0.2)',
    action,
}: RiderSectionProps) {
    return (
        <section className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-4">
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                        <h3 className="font-semibold text-foreground">{title}</h3>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>
            <div className="relative px-4 py-4">{children}</div>
            <div
                className="absolute bottom-0 left-1/2 h-10 w-[70%] -translate-x-1/2 blur-2xl"
                style={{ background: glow }}
            />
        </section>
    )
}
