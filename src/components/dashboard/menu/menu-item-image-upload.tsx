'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { uploadMenuItemImage, removeMenuItemImage } from '@/app/dashboard/menu/image-actions'

interface MenuItemImageUploadProps {
    itemId: string
    currentImageUrl?: string | null
    onUploadComplete?: (url: string) => void
}

export function MenuItemImageUpload({ itemId, currentImageUrl, onUploadComplete }: MenuItemImageUploadProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isPending, startTransition] = useTransition()
    const [preview, setPreview] = useState<string | null>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB')
            return
        }

        // Show preview and upload
        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)

        // Upload
        const formData = new FormData()
        formData.append('file', file)

        startTransition(async () => {
            const result = await uploadMenuItemImage(itemId, formData)
            if (result.error) {
                toast.error(result.error)
                setPreview(null)
            } else if (result.data) {
                toast.success('Image uploaded!')
                onUploadComplete?.(result.data.url)
                router.refresh()
            }
        })
    }

    const handleRemove = () => {
        startTransition(async () => {
            const result = await removeMenuItemImage(itemId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Image removed')
                setPreview(null)
                router.refresh()
            }
        })
    }

    const displayImage = preview || currentImageUrl

    return (
        <div className="space-y-2">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {displayImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                    <Image
                        src={displayImage}
                        alt="Item image"
                        fill
                        className="object-cover"
                    />
                    {isPending && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                    )}
                    {!isPending && (
                        <div className="absolute bottom-2 right-2 flex gap-1">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                Change
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={handleRemove}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    className="w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                    {isPending ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <>
                            <ImagePlus className="h-8 w-8" />
                            <span className="text-sm">Add Image</span>
                        </>
                    )}
                </button>
            )}
        </div>
    )
}
