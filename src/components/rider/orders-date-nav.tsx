'use client'

import { useMemo, useRef } from 'react'
import { useRouter } from 'nextjs-toploader/app'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface OrdersDateNavProps {
    selectedDate: string
    todayDate: string
}

function addDays(dateString: string, deltaDays: number) {
    const date = new Date(`${dateString}T00:00:00`)
    date.setDate(date.getDate() + deltaDays)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function OrdersDateNav({ selectedDate, todayDate }: OrdersDateNavProps) {
    const router = useRouter()
    const dateInputRef = useRef<HTMLInputElement>(null)

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

    const goToDate = (date: string) => {
        router.push(`/rider/orders?date=${date}`)
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

    return (
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-2 py-1.5">
            <button
                type="button"
                onClick={() => goToDate(previousDate)}
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
                    if (e.target.value) goToDate(e.target.value)
                }}
                className="sr-only"
                aria-label="Select date"
            />

            <button
                type="button"
                onClick={() => goToDate(nextDate)}
                disabled={isTodaySelected}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next date"
            >
                <ChevronRight className="h-5 w-5" />
            </button>
        </div>
    )
}
