// Calculate restaurant profile completion percentage
// Only counts essential input fields for going online
export function calculateProfileCompletion(restaurant: {
    name?: string | null
    description?: string | null
    logo_url?: string | null
    phone?: string | null
    address_line1?: string | null
    city?: string | null
    pincode?: string | null
    latitude?: number | null
    longitude?: number | null
    cuisine_type?: string[] | null
}, settings?: {
    opening_time?: string | null
    closing_time?: string | null
} | null): { percentage: number; missing: string[] } {
    // Only essential fields for going online
    const fields = [
        { name: 'Restaurant Name', filled: !!restaurant.name },
        { name: 'Description', filled: !!restaurant.description },
        { name: 'Logo', filled: !!restaurant.logo_url },
        { name: 'Phone Number', filled: !!restaurant.phone },
        { name: 'Address', filled: !!restaurant.address_line1 },
        { name: 'City', filled: !!restaurant.city },
        { name: 'Pincode', filled: !!restaurant.pincode },
        { name: 'Location on Map', filled: !!(restaurant.latitude && restaurant.longitude) },
        { name: 'Cuisine Type', filled: !!(restaurant.cuisine_type && restaurant.cuisine_type.length > 0) },
        { name: 'Operating Hours', filled: !!(settings && settings.opening_time && settings.closing_time) },
    ]

    const missing: string[] = []
    let completed = 0

    fields.forEach(field => {
        if (field.filled) {
            completed++
        } else {
            missing.push(field.name)
        }
    })

    const percentage = Math.round((completed / fields.length) * 100)

    return { percentage, missing }
}

export function isProfileComplete(percentage: number): boolean {
    return percentage === 100
}
