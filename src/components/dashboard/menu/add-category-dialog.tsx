"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, FolderPlus } from "lucide-react"
import { toast } from "sonner"
import { createCategory } from "@/app/dashboard/menu/actions"

interface AddCategoryDialogProps {
  trigger?: React.ReactNode
}

export function AddCategoryDialog({ trigger }: AddCategoryDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError("Category name is required")
      return
    }

    startTransition(async () => {
      const result = await createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Category created successfully!")
        setFormData({ name: "", description: "" })
        setError("")
        setOpen(false)
        router.refresh()
      }
    })
  }

  const defaultTrigger = (
    <Button size="sm" className="gap-1.5 w-full sm:w-auto">
      <FolderPlus className="h-4 w-4" />
      Category
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Create Category
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Create a new category to organize your menu items
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cat_name" className="text-sm font-medium">
              Category Name *
            </Label>
            <Input
              id="cat_name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }))
                setError("")
              }}
              placeholder="e.g., Starters, Main Course, Desserts"
              className={`text-base ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat_desc" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="cat_desc"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this category"
              rows={3}
              className="text-base resize-none"
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 border-t bg-muted/20">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto text-base">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full sm:w-auto text-base">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
