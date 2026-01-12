'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const FILTER_OPTIONS = [
    { key: 'veg', label: '🌱 Veg', value: 'true' },
    { key: 'nonveg', label: '🍖 Non-Veg', value: 'true' },
    { key: 'spicy', label: '🌶️ Spicy', value: 'true' },
    { key: 'bestseller', label: '⭐ Bestseller', value: 'true' },
    { key: 'featured', label: '✨ Featured', value: 'true' },
    { key: 'available', label: '✅ Available', value: 'true' },
]

export function MenuFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const activeFilters = FILTER_OPTIONS.filter(option =>
        searchParams.get(option.key) === option.value
    )

    const toggleFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (params.get(key) === value) {
            params.delete(key)
        } else {
            params.set(key, value)
        }

        startTransition(() => {
            router.push(`?${params.toString()}`)
        })
    }

    const clearAllFilters = () => {
        const params = new URLSearchParams(searchParams.toString())
        FILTER_OPTIONS.forEach(option => params.delete(option.key))
        const search = params.get('search')
        startTransition(() => {
            router.push(search ? `?search=${search}` : '?')
        })
    }

    return (
        <div className="space-y-3">
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filters:</span>
                {FILTER_OPTIONS.map(option => {
                    const isActive = searchParams.get(option.key) === option.value
                    return (
                        <Badge
                            key={option.key}
                            variant={isActive ? 'default' : 'outline'}
                            className="cursor-pointer whitespace-nowrap hover:bg-primary/90"
                            onClick={() => toggleFilter(option.key, option.value)}
                        >
                            {option.label}
                        </Badge>
                    )
                })}
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Active:</span>
                    {activeFilters.map(filter => (
                        <Badge
                            key={filter.key}
                            variant="secondary"
                            className="cursor-pointer gap-1"
                            onClick={() => toggleFilter(filter.key, filter.value)}
                        >
                            {filter.label}
                            <X className="h-3 w-3" />
                        </Badge>
                    ))}
                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    )
}
