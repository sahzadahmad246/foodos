import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
    public_id: string
    secure_url: string
    width: number
    height: number
}

// Upload image to Cloudinary
export async function uploadImage(
    base64Data: string,
    folder: string = 'foodos'
): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: 'image',
        transformation: [
            { quality: 'auto', fetch_format: 'auto' }
        ]
    })

    return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
    }
}

// Delete image from Cloudinary
export async function deleteImage(publicId: string): Promise<boolean> {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return result.result === 'ok'
    } catch {
        console.error('Failed to delete image:', publicId)
        return false
    }
}

// Get optimized URL
export function getOptimizedUrl(publicId: string, options?: { width?: number, height?: number }): string {
    return cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto',
        width: options?.width,
        height: options?.height,
        crop: 'fill',
    })
}

export { cloudinary }
