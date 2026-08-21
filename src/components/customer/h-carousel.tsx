'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HCarouselProps {
    children: React.ReactNode
    className?: string
    contentClassName?: string
}

export function HCarousel({ children, className, contentClassName }: HCarouselProps) {
    const scrollerRef = useRef<HTMLDivElement | null>(null)
    const [canLeft, setCanLeft] = useState(false)
    const [canRight, setCanRight] = useState(false)

    const update = useCallback(() => {
        const el = scrollerRef.current
        if (!el) return
        const max = el.scrollWidth - el.clientWidth
        setCanLeft(el.scrollLeft > 8)
        setCanRight(max > 8 && el.scrollLeft < max - 8)
    }, [])

    useEffect(() => {
        const el = scrollerRef.current
        if (!el) return
        update()
        const later = window.setTimeout(update, 400)
        el.addEventListener('scroll', update, { passive: true })
        const observer = new ResizeObserver(update)
        observer.observe(el)
        window.addEventListener('resize', update)
        return () => {
            window.clearTimeout(later)
            el.removeEventListener('scroll', update)
            observer.disconnect()
            window.removeEventListener('resize', update)
        }
    }, [update, children])

    const scrollByDir = (dir: -1 | 1) => {
        const el = scrollerRef.current
        if (!el) return
        el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.7), behavior: 'smooth' })
    }

    return (
        <div className={cn('relative', className)}>
            {canLeft ? (
                <button
                    type="button"
                    onClick={() => scrollByDir(-1)}
                    className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background text-primary shadow-lg hover:bg-primary hover:text-primary-foreground"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
            ) : null}
            {canRight ? (
                <button
                    type="button"
                    onClick={() => scrollByDir(1)}
                    className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background text-primary shadow-lg hover:bg-primary hover:text-primary-foreground"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            ) : null}
            <div className="overflow-hidden">
                <div
                    ref={scrollerRef}
                    className={cn(
                        'scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-8 -mb-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0',
                        contentClassName
                    )}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}
