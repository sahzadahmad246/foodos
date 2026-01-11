"use client"

import type React from "react"

import { useState, useTransition, useRef } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, UtensilsCrossed, ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { createMenuItem } from "@/app/dashboard/menu/actions"
import { uploadMenuItemImage } from "@/app/dashboard/menu/image-actions"

interface Category {
  id: string
  name: string
}

interface AddItemDialogProps {
  categories: Category[]
  defaultCategoryId?: string
  trigger?: React.ReactNode
}

export function AddItemDialog({ categories, defaultCategoryId, trigger }: AddItemDialogProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compare_at_price: "",
    category_id: defaultCategoryId || "",
    is_veg: true,
    is_spicy: false,
    is_bestseller: false,
    is_featured: false,
    preparation_time_mins: "20",
    serves: "1",
    portion_size: "",
    calories: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = "Item name is required"
    }
    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    startTransition(async () => {
      const result = await createMenuItem({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Number.parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? Number.parseFloat(formData.compare_at_price) : undefined,
        category_id: formData.category_id || null,
        is_veg: formData.is_veg,
        is_spicy: formData.is_spicy,
        is_bestseller: formData.is_bestseller,
        is_featured: formData.is_featured,
        is_new: true,
        preparation_time_mins: Number.parseInt(formData.preparation_time_mins) || 20,
        serves: Number.parseInt(formData.serves) || 1,
        portion_size: formData.portion_size.trim() || undefined,
        calories: formData.calories ? Number.parseInt(formData.calories) : undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (imageFile && result.data?.id) {
        const formDataImage = new FormData()
        formDataImage.append("file", imageFile)
        const uploadResult = await uploadMenuItemImage(result.data.id, formDataImage)
        if (uploadResult.error) {
          toast.error("Item created but image upload failed")
        }
      }

      toast.success("Item added successfully!")
      setFormData({
        name: "",
        description: "",
        price: "",
        compare_at_price: "",
        category_id: defaultCategoryId || "",
        is_veg: true,
        is_spicy: false,
        is_bestseller: false,
        is_featured: false,
        preparation_time_mins: "20",
        serves: "1",
        portion_size: "",
        calories: "",
      })
      removeImage()
      setOpen(false)
      router.refresh()
    })
  }

  const defaultTrigger = (
    <Button size="sm" className="gap-1.5 w-full sm:w-auto">
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Add Item</span>
      <span className="sm:hidden">Add</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Add Menu Item
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Fill in the details below to add a new item to your menu
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
          {/* Image Upload - Responsive */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Image</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary/20 bg-muted">
                <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all hover:bg-muted/30"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Click to add image</span>
              </button>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Item Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }))
                setErrors((prev) => ({ ...prev, name: "" }))
              }}
              placeholder="e.g., Paneer Tikka"
              className={`text-base ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the dish"
              rows={3}
              className="text-base resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select
              value={formData.category_id || "none"}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category_id: value === "none" ? "" : value }))
              }
            >
              <SelectTrigger id="category" className="text-base">
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

          {/* Price Grid - Responsive 1 or 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                Price (₹) *
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                  setErrors((prev) => ({ ...prev, price: "" }))
                }}
                placeholder="99"
                step="0.01"
                className={`text-base ${errors.price ? "border-red-500" : ""}`}
              />
              {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="compare_price" className="text-sm font-medium">
                Compare Price
              </Label>
              <Input
                id="compare_price"
                type="number"
                value={formData.compare_at_price}
                onChange={(e) => setFormData((prev) => ({ ...prev, compare_at_price: e.target.value }))}
                placeholder="149 (shows discount)"
                step="0.01"
                className="text-base"
              />
            </div>
          </div>

          {/* Prep Time & Serves */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prep_time" className="text-sm font-medium">
                Prep Time (mins)
              </Label>
              <Input
                id="prep_time"
                type="number"
                value={formData.preparation_time_mins}
                onChange={(e) => setFormData((prev) => ({ ...prev, preparation_time_mins: e.target.value }))}
                placeholder="20"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serves" className="text-sm font-medium">
                Serves
              </Label>
              <Input
                id="serves"
                type="number"
                value={formData.serves}
                onChange={(e) => setFormData((prev) => ({ ...prev, serves: e.target.value }))}
                placeholder="1"
                className="text-base"
              />
            </div>
          </div>

          {/* Portion & Calories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portion" className="text-sm font-medium">
                Portion Size
              </Label>
              <Input
                id="portion"
                value={formData.portion_size}
                onChange={(e) => setFormData((prev) => ({ ...prev, portion_size: e.target.value }))}
                placeholder="250g, 2 pcs"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories" className="text-sm font-medium">
                Calories
              </Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData((prev) => ({ ...prev, calories: e.target.value }))}
                placeholder="350"
                className="text-base"
              />
            </div>
          </div>

          {/* Toggles - Better spacing */}
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

        {/* Footer - Responsive buttons */}
        <div className="px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 shrink-0 border-t bg-muted/20">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto text-base">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full sm:w-auto text-base">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
