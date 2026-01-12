'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { AddCategoryDialog } from "@/components/dashboard/menu/add-category-dialog"
import { AddItemDialog } from "@/components/dashboard/menu/add-item-dialog"
import { MenuFilters } from "./menu-filters"

interface Category {
    id: string
    name: string
}

interface MenuHeaderProps {
    categories: Category[]
}

export function MenuHeader({ categories }: MenuHeaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const searchValue = searchParams.get('search') || ''

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const search = formData.get('search') as string

        const params = new URLSearchParams(searchParams.toString())
        if (search) {
            params.set('search', search)
        } else {
            params.delete('search')
        }

        startTransition(() => {
            router.push(`?${params.toString()}`)
        })
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // If input is cleared (empty), remove search param from URL
        if (e.target.value === '') {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('search')
            startTransition(() => {
                router.push(`?${params.toString()}`)
            })
        }
    }

    return (
        <>
            {/* Loading bar */}
            {isPending && (
                <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-pulse">
                    <div className="h-full bg-blue-400 animate-[shimmer_1s_ease-in-out_infinite]" />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            name="search"
                            defaultValue={searchValue}
                            onChange={handleInputChange}
                            placeholder="Search menu items..."
                            className="max-w-md pl-9"
                        />
                    </form>
                    <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-2 w-full sm:w-auto">
                        <AddCategoryDialog />
                        <AddItemDialog categories={categories} />
                    </div>
                </div>

                <MenuFilters />
            </div>
        </>
    )
}
