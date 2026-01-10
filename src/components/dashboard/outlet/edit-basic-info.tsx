'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Loader2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { updateRestaurant } from '@/app/onboarding/actions'

interface EditBasicInfoDialogProps {
    restaurant: {
        id: string
        name: string
        description: string | null
        cuisine_type: string[] | null
    }
}

const CUISINE_OPTIONS = [
    'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican',
    'Thai', 'Japanese', 'Continental', 'Fast Food', 'Street Food',
    'Desserts', 'Beverages', 'Bakery', 'Seafood', 'Biryani',
    'Pizza', 'Burgers', 'Healthy', 'Vegan', 'Mughlai'
]

const validateName = (name: string): string | null => {
    if (!name.trim()) return 'Restaurant name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.trim().length > 100) return 'Name is too long'
    return null
}

export function EditBasicInfoDialog({ restaurant }: EditBasicInfoDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [formData, setFormData] = useState({
        name: restaurant.name,
        description: restaurant.description || '',
        cuisine_type: restaurant.cuisine_type || [],
    })
    const [cuisineInput, setCuisineInput] = useState('')

    const addCuisine = (cuisine: string) => {
        if (cuisine && !formData.cuisine_type.includes(cuisine)) {
            setFormData(prev => ({
                ...prev,
                cuisine_type: [...prev.cuisine_type, cuisine]
            }))
        }
        setCuisineInput('')
    }

    const removeCuisine = (cuisine: string) => {
        setFormData(prev => ({
            ...prev,
            cuisine_type: prev.cuisine_type.filter(c => c !== cuisine)
        }))
    }

    const validate = (): boolean => {
        const nameError = validateName(formData.name)
        setErrors({ name: nameError })
        return nameError === null
    }

    const handleSubmit = () => {
        if (!validate()) return

        startTransition(async () => {
            const result = await updateRestaurant(restaurant.id, formData as any)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Basic info updated')
                setOpen(false)
                router.refresh()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Basic Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm">Restaurant Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, name: e.target.value }))
                                setErrors(prev => ({ ...prev, name: validateName(e.target.value) }))
                            }}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-sm">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            placeholder="Tell customers about your restaurant..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm">Cuisine Type</Label>
                        {formData.cuisine_type.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {formData.cuisine_type.map(cuisine => (
                                    <Badge key={cuisine} variant="secondary" className="gap-1 pr-1">
                                        {cuisine}
                                        <button onClick={() => removeCuisine(cuisine)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type or select below..."
                                value={cuisineInput}
                                onChange={(e) => setCuisineInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addCuisine(cuisineInput)
                                    }
                                }}
                                className="text-sm"
                            />
                            <Button type="button" size="icon" variant="outline" onClick={() => addCuisine(cuisineInput)} className="shrink-0">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {CUISINE_OPTIONS.filter(c => !formData.cuisine_type.includes(c)).slice(0, 6).map(cuisine => (
                                <Badge
                                    key={cuisine}
                                    variant="outline"
                                    className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                                    onClick={() => addCuisine(cuisine)}
                                >
                                    + {cuisine}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
