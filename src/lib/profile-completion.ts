// Calculate restaurant profile completion percentage
// Only counts essential fields for display purposes
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
    const hasValue = (value?: string | null) => typeof value === 'string' && value.trim().length > 0
    const hasCoordinates =
        restaurant.latitude !== null &&
        restaurant.latitude !== undefined &&
        restaurant.longitude !== null &&
        restaurant.longitude !== undefined
    const hasOperatingHours = !!settings && hasValue(settings.opening_time) && hasValue(settings.closing_time)

    // All fields for percentage display
    const fields = [
        { name: 'Restaurant Name', filled: hasValue(restaurant.name) },
        { name: 'Description', filled: hasValue(restaurant.description) },
        { name: 'Logo', filled: hasValue(restaurant.logo_url) },
        { name: 'Phone Number', filled: hasValue(restaurant.phone) },
        { name: 'Address', filled: hasValue(restaurant.address_line1) },
        { name: 'City', filled: hasValue(restaurant.city) },
        { name: 'Pincode', filled: hasValue(restaurant.pincode) },
        { name: 'Location on Map', filled: hasCoordinates },
        { name: 'Cuisine Type', filled: !!(restaurant.cuisine_type && restaurant.cuisine_type.length > 0) },
        { name: 'Operating Hours', filled: hasOperatingHours },
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

// Check if restaurant can go online - only requires essential data
export function canGoOnline(restaurant: {
    name?: string | null
    phone?: string | null
    address_line1?: string | null
    city?: string | null
}): { allowed: boolean; missing: string[] } {
    // Only TRULY required fields to go online
    const required = [
        { name: 'Restaurant Name', filled: !!restaurant.name },
        { name: 'Phone Number', filled: !!restaurant.phone },
        { name: 'Address', filled: !!restaurant.address_line1 },
        { name: 'City', filled: !!restaurant.city },
    ]

    const missing: string[] = []
    required.forEach(field => {
        if (!field.filled) missing.push(field.name)
    })

    return { allowed: missing.length === 0, missing }
}

// Legacy function - kept for compatibility
export function isProfileComplete(percentage: number): boolean {
    return percentage === 100
}
