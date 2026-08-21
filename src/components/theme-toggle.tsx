'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const MODES = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
] as const

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
    const { theme, setTheme } = useTheme()
    const mounted = useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false
    )

    if (!mounted) {
        return <div className={compact ? 'h-9 w-[148px]' : 'h-11 w-full'} />
    }

    return (
        <div className={cn('grid grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1', compact && 'p-0.5')}>
            {MODES.map((mode) => {
                const Icon = mode.icon
                const active = theme === mode.value
                return (
                    <button
                        key={mode.value}
                        type="button"
                        onClick={() => setTheme(mode.value)}
                        className={cn(
                            'inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition',
                            compact ? 'h-8 px-2' : 'h-9 px-2',
                            active
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                        aria-pressed={active}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        <span className={compact ? 'hidden sm:inline' : undefined}>{mode.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
