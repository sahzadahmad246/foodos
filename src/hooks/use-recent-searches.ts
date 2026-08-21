'use client'

import { useCallback, useEffect, useState } from 'react'

const MAX_RECENT = 8

function storageKey(slug: string) {
    return `foodos-recent-searches:${slug}`
}

function readRecent(slug: string): string[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = window.localStorage.getItem(storageKey(slug))
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item.trim()) : []
    } catch {
        return []
    }
}

export function useRecentSearches(slug: string) {
    const [recent, setRecent] = useState<string[]>([])

    useEffect(() => {
        setRecent(readRecent(slug))
    }, [slug])

    const persist = useCallback((next: string[]) => {
        setRecent(next)
        window.localStorage.setItem(storageKey(slug), JSON.stringify(next))
    }, [slug])

    const addRecent = useCallback((query: string) => {
        const value = query.trim()
        if (value.length < 2) return
        const current = readRecent(slug)
        const next = [value, ...current.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, MAX_RECENT)
        persist(next)
    }, [persist, slug])

    const removeRecent = useCallback((query: string) => {
        persist(readRecent(slug).filter((item) => item !== query))
    }, [persist, slug])

    const clearRecent = useCallback(() => {
        persist([])
    }, [persist])

    return { recent, addRecent, removeRecent, clearRecent }
}
