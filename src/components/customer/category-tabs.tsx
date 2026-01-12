'use client'

import { Badge } from '@/components/ui/badge'

interface Category {
    id: string
    name: string
}

interface CategoryTabsProps {
    categories: Category[]
    selectedCategory: string | null
    onSelectCategory: (categoryId: string | null) => void
}

export function CategoryTabs({ categories, selectedCategory, onSelectCategory }: CategoryTabsProps) {
    return (
        <div className="border-t bg-background">
            <div className="container max-w-7xl mx-auto px-4">
                <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
                    <Badge
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => onSelectCategory(null)}
                    >
                        All
                    </Badge>
                    {categories.map((category) => (
                        <Badge
                            key={category.id}
                            variant={selectedCategory === category.id ? 'default' : 'outline'}
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => onSelectCategory(category.id)}
                        >
                            {category.name}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    )
}
