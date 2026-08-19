'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'nextjs-toploader/app'
import { CalendarDays, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RiderOrdersFilterProps {
    riderId: string
    riderName?: string
    selectedDate: string
    todayDate: string
    initialQuery: string
}

function addDays(dateString: string, deltaDays: number) {
    const date = new Date(`${dateString}T00:00:00`)
    date.setDate(date.getDate() + deltaDays)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function buildUrl(riderId: string, date: string, query: string, riderName?: string) {
    const params = new URLSearchParams()
    params.set('date', date)
    if (query.trim()) params.set('q', query.trim())
    if (riderName) params.set('name', riderName)
    return `/dashboard/riders/${riderId}?${params.toString()}`
}

export function RiderOrdersFilter({
    riderId,
    riderName,
    selectedDate,
    todayDate,
    initialQuery,
}: RiderOrdersFilterProps) {
    const router = useRouter()
    const dateInputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState(initialQuery)

    const isTodaySelected = selectedDate >= todayDate
    const previousDate = useMemo(() => addDays(selectedDate, -1), [selectedDate])
    const nextDate = useMemo(() => addDays(selectedDate, 1), [selectedDate])

    const formattedLabel = useMemo(() => {
        const date = new Date(`${selectedDate}T00:00:00`)
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date)
    }, [selectedDate])

    const navigate = (nextDateValue: string, nextQuery?: string) => {
        router.push(buildUrl(riderId, nextDateValue, nextQuery ?? query, riderName))
    }

    const openCalendar = () => {
        const input = dateInputRef.current
        if (!input) return
        if (typeof input.showPicker === 'function') {
            input.showPicker()
            return
        }
        input.focus()
        input.click()
    }

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault()
        navigate(selectedDate, query)
    }

    const clearSearch = () => {
        setQuery('')
        navigate(selectedDate, '')
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-2 py-1.5">
                <button
                    type="button"
                    onClick={() => navigate(previousDate)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Previous date"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                    type="button"
                    onClick={openCalendar}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{formattedLabel}</span>
                </button>

                <input
                    ref={dateInputRef}
                    type="date"
                    value={selectedDate}
                    max={todayDate}
                    onChange={(e) => {
                        if (e.target.value) navigate(e.target.value)
                    }}
                    className="sr-only"
                    aria-label="Select date"
                />

                <button
                    type="button"
                    onClick={() => navigate(nextDate)}
                    disabled={isTodaySelected}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next date"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            <form onSubmit={submitSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search order #, customer, phone, address"
                        className="pl-9"
                    />
                </div>
                {query && (
                    <Button type="button" variant="outline" size="icon" onClick={clearSearch} aria-label="Clear search">
                        <X className="h-4 w-4" />
                    </Button>
                )}
                <Button type="submit">Search</Button>
            </form>
        </div>
    )
}
