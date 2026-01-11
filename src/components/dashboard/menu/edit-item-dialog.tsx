"use client"

import type React from "react"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Pencil, ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { updateMenuItem } from "@/app/dashboard/menu/actions"
import { uploadMenuItemImage, removeMenuItemImage } from "@/app/dashboard/menu/image-actions"

interface Category {
    id: string
    name: string
}

interface MenuItem {
    id: string
    name: string
    description?: string | null
    price: number
    compare_at_price?: number | null
    image_url?: string | null
    category_id?: string | null
    is_veg: boolean
    is_spicy?: boolean
    is_bestseller?: boolean
    is_featured?: boolean
    preparation_time_mins?: number | null
    serves?: number | null
    portion_size?: string | null
    calories?: number | null
}

interface EditItemDialogProps {
    item: MenuItem
    categories: Category[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditItemDialog({ item, categories, open, onOpenChange }: EditItemDialogProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isPending, startTransition] = useTransition()
    const [isUploading, setIsUploading] = useState(false)
    const [currentImageUrl, setCurrentImageUrl] = useState(item.image_url)
    const [formData, setFormData] = useState({
        name: item.name,
        description: item.description || "",
        price: String(item.price),
        compare_at_price: item.compare_at_price ? String(item.compare_at_price) : "",
        category_id: item.category_id || "",
        is_veg: item.is_veg,
        is_spicy: item.is_spicy || false,
        is_bestseller: item.is_bestseller || false,
        is_featured: item.is_featured || false,
        preparation_time_mins: String(item.preparation_time_mins || 20),
        serves: String(item.serves || 1),
        portion_size: item.portion_size || "",
        calories: item.calories ? String(item.calories) : "",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Reset form when item changes
    useEffect(() => {
        setFormData({
            name: item.name,
            description: item.description || "",
            price: String(item.price),
            compare_at_price: item.compare_at_price ? String(item.compare_at_price) : "",
            category_id: item.category_id || "",
            is_veg: item.is_veg,
            is_spicy: item.is_spicy || false,
            is_bestseller: item.is_bestseller || false,
            is_featured: item.is_featured || false,
            preparation_time_mins: String(item.preparation_time_mins || 20),
            serves: String(item.serves || 1),
            portion_size: item.portion_size || "",
            calories: item.calories ? String(item.calories) : "",
        })
        setCurrentImageUrl(item.image_url)
    }, [item])

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB")
            return
        }

        setIsUploading(true)
        const formDataImage = new FormData()
        formDataImage.append("file", file)
        const result = await uploadMenuItemImage(item.id, formDataImage)
        setIsUploading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            setCurrentImageUrl(result.data?.url || null)
            toast.success("Image uploaded!")
            router.refresh()
        }
    }

    const handleRemoveImage = async () => {
        setIsUploading(true)
        const result = await removeMenuItemImage(item.id)
        setIsUploading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            setCurrentImageUrl(null)
            toast.success("Image removed")
            router.refresh()
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}
        if (!formData.name.trim()) newErrors.name = "Name required"
        if (!formData.price || Number.parseFloat(formData.price) <= 0) newErrors.price = "Valid price required"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return

        startTransition(async () => {
            const result = await updateMenuItem(item.id, {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                price: Number.parseFloat(formData.price),
                compare_at_price: formData.compare_at_price ? Number.parseFloat(formData.compare_at_price) : undefined,
                category_id: formData.category_id || null,
                is_veg: formData.is_veg,
                is_spicy: formData.is_spicy,
                is_bestseller: formData.is_bestseller,
                is_featured: formData.is_featured,
                preparation_time_mins: Number.parseInt(formData.preparation_time_mins) || 20,
                serves: Number.parseInt(formData.serves) || 1,
                portion_size: formData.portion_size.trim() || undefined,
                calories: formData.calories ? Number.parseInt(formData.calories) : undefined,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Item updated!")
                onOpenChange(false)
                router.refresh()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b">
                    <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-primary" />
                        Edit Menu Item
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                        Update the details of {item.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Image</Label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                        {currentImageUrl ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary/20 bg-muted">
                                <Image src={currentImageUrl} alt="Item" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    disabled={isUploading}
                                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all hover:bg-muted/30 disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                ) : (
                                    <>
                                        <ImagePlus className="h-8 w-8" />
                                        <span className="text-sm font-medium">Click to add image</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="edit_name" className="text-sm font-medium">
                            Item Name *
                        </Label>
                        <Input
                            id="edit_name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                                setErrors((prev) => ({ ...prev, name: "" }))
                            }}
                            className={`text-base ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                        {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="edit_description" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="edit_description"
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="text-base resize-none"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="edit_category" className="text-sm font-medium">
                            Category
                        </Label>
                        <Select
                            value={formData.category_id || "none"}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value === "none" ? "" : value }))}
                        >
                            <SelectTrigger id="edit_category" className="text-base">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Uncategorized</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_price" className="text-sm font-medium">
                                Price (₹) *
                            </Label>
                            <Input
                                id="edit_price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => {
                                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                                    setErrors((prev) => ({ ...prev, price: "" }))
                                }}
                                step="0.01"
                                className={`text-base ${errors.price ? "border-red-500" : ""}`}
                            />
                            {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_compare_price" className="text-sm font-medium">
                                Compare Price
                            </Label>
                            <Input
                                id="edit_compare_price"
                                type="number"
                                value={formData.compare_at_price}
                                onChange={(e) => setFormData((prev) => ({ ...prev, compare_at_price: e.target.value }))}
                                step="0.01"
                                className="text-base"
                            />
                        </div>
                    </div>

                    {/* Prep Time & Serves */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_prep_time" className="text-sm font-medium">
                                Prep Time (mins)
                            </Label>
                            <Input
                                id="edit_prep_time"
                                type="number"
                                value={formData.preparation_time_mins}
                                onChange={(e) => setFormData((prev) => ({ ...prev, preparation_time_mins: e.target.value }))}
                                className="text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_serves" className="text-sm font-medium">
                                Serves
                            </Label>
                            <Input
                                id="edit_serves"
                                type="number"
                                value={formData.serves}
                                onChange={(e) => setFormData((prev) => ({ ...prev, serves: e.target.value }))}
                                className="text-base"
                            />
                        </div>
                    </div>

                    {/* Portion & Calories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_portion" className="text-sm font-medium">
                                Portion Size
                            </Label>
                            <Input
                                id="edit_portion"
                                value={formData.portion_size}
                                onChange={(e) => setFormData((prev) => ({ ...prev, portion_size: e.target.value }))}
                                placeholder="250g, 2 pcs"
                                className="text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_calories" className="text-sm font-medium">
                                Calories
                            </Label>
                            <Input
                                id="edit_calories"
                                type="number"
                                value={formData.calories}
                                onChange={(e) => setFormData((prev) => ({ ...prev, calories: e.target.value }))}
                                placeholder="350"
                                className="text-base"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-foreground">Item Attributes</h4>
                        <div className="space-y-3">
                            {[
                                { key: "is_veg", label: "Vegetarian", desc: "Mark as veg item" },
                                { key: "is_spicy", label: "Spicy", desc: "Show spicy indicator" },
                                { key: "is_bestseller", label: "Bestseller", desc: "Show bestseller badge" },
                                { key: "is_featured", label: "Featured", desc: "Show in featured section" },
                            ].map(({ key, label, desc }) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium">{label}</p>
                                        <p className="text-xs text-muted-foreground">{desc}</p>
                                    </div>
                                    <Switch
                                        checked={formData[key as keyof typeof formData] as boolean}
                                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, [key]: checked }))}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 shrink-0 border-t bg-muted/20">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-base">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="w-full sm:w-auto text-base">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
