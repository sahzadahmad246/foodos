'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
    fallbackHref?: string
    className?: string
}

export function BackButton({ fallbackHref = '/', className }: BackButtonProps) {
    const router = useRouter()

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back()
            return
        }
        router.push(fallbackHref)
    }

    return (
        <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-muted/80',
                className
            )}
        >
            <ArrowLeft className="h-4 w-4" />
        </button>
    )
}
