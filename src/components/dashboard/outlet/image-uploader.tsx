'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { uploadRestaurantLogo, uploadRestaurantCover, removeRestaurantLogo, removeRestaurantCover } from '@/app/dashboard/outlet/upload-actions'

interface ImageUploaderProps {
    restaurantId: string
    type: 'logo' | 'cover'
    currentUrl?: string | null
    currentPublicId?: string | null
}

export function ImageUploader({ restaurantId, type, currentUrl, currentPublicId }: ImageUploaderProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isPending, startTransition] = useTransition()
    const [isRemoving, setIsRemoving] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB')
            return
        }

        // Convert to base64
        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            setPreview(base64)
            uploadFile(base64)
        }
        reader.readAsDataURL(file)
    }

    const uploadFile = (base64Data: string) => {
        startTransition(async () => {
            const action = type === 'logo' ? uploadRestaurantLogo : uploadRestaurantCover
            const result = await action(restaurantId, base64Data, currentPublicId || undefined)

            if (result.error) {
                toast.error(result.error)
                setPreview(null)
            } else {
                toast.success(`${type === 'logo' ? 'Logo' : 'Cover'} updated!`)
                router.refresh()
            }
        })
    }

    const handleRemove = () => {
        setIsRemoving(true)
        startTransition(async () => {
            const action = type === 'logo' ? removeRestaurantLogo : removeRestaurantCover
            const result = await action(restaurantId)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`${type === 'logo' ? 'Logo' : 'Cover'} removed`)
                setPreview(null)
                router.refresh()
            }
            setIsRemoving(false)
        })
    }

    const displayUrl = preview || currentUrl

    if (type === 'logo') {
        return (
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex items-center justify-center border-2 border-dashed">
                        {displayUrl ? (
                            <Image
                                src={displayUrl}
                                alt="Restaurant logo"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <Camera className="h-6 w-6 text-muted-foreground" />
                        )}
                        {isPending && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        )}
                    </div>
                    {displayUrl && !isPending && (
                        <button
                            onClick={handleRemove}
                            disabled={isRemoving}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/80"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
                <div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending}
                    >
                        {displayUrl ? 'Change' : 'Upload'} Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG/PNG</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        )
    }

    // Cover image
    return (
        <div className="relative">
            <div className="h-32 md:h-40 rounded-xl overflow-hidden bg-muted flex items-center justify-center border-2 border-dashed">
                {displayUrl ? (
                    <Image
                        src={displayUrl}
                        alt="Restaurant cover"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="text-center">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Add cover image</p>
                    </div>
                )}
                {isPending && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
            </div>
            <div className="absolute bottom-2 right-2 flex gap-2">
                {displayUrl && !isPending && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="h-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    className="h-8"
                >
                    <Camera className="h-4 w-4 mr-1" />
                    {displayUrl ? 'Change' : 'Add'}
                </Button>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    )
}
