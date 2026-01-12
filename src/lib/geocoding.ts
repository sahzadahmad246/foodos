// Reverse geocoding to get address from coordinates
export async function reverseGeocode(lat: number, lon: number) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'FoodOS-App',
                },
            }
        )

        if (!response.ok) {
            throw new Error('Geocoding failed')
        }

        const data = await response.json()

        return {
            display_name: data.display_name,
            locality: data.address?.suburb || data.address?.neighbourhood || data.address?.road,
            city: data.address?.city || data.address?.town || data.address?.village,
            state: data.address?.state,
            pincode: data.address?.postcode,
        }
    } catch (error) {
        console.error('Reverse geocode error:', error)
        return null
    }
}

// Forward geocoding to get coordinates from address
export async function forwardGeocode(query: string) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
            {
                headers: {
                    'User-Agent': 'FoodOS-App',
                },
            }
        )

        if (!response.ok) {
            throw new Error('Geocoding failed')
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Forward geocode error:', error)
        return []
    }
}
