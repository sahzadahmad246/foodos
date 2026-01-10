'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Store, MapPin, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createRestaurant, checkSlugAvailability } from './actions'

// Dynamic import to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
    () => import('@/components/location-picker').then(mod => mod.LocationPicker),
    {
        ssr: false,
        loading: () => (
            <div className="h-64 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }
)

const STEPS = [
    { id: 1, title: 'Basic Info', icon: Store },
    { id: 2, title: 'Location', icon: MapPin },
    { id: 3, title: 'Complete', icon: CheckCircle },
]

// Validation helpers
const validatePhone = (phone: string): string | null => {
    if (!phone) return null // Optional field
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) return 'Phone number must be at least 10 digits'
    if (cleaned.length > 12) return 'Phone number too long'
    return null
}

const validatePincode = (pincode: string): string | null => {
    if (!pincode) return null // Optional
    if (!/^\d{6}$/.test(pincode)) return 'Pincode must be 6 digits'
    return null
}

const validateName = (name: string): string | null => {
    if (!name.trim()) return 'Restaurant name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.trim().length > 100) return 'Name is too long'
    return null
}

const validateSlug = (slug: string): string | null => {
    if (!slug) return 'URL is required'
    if (slug.length < 3) return 'URL must be at least 3 characters'
    if (slug.length > 50) return 'URL is too long'
    if (!/^[a-z0-9-]+$/.test(slug)) return 'URL can only contain lowercase letters, numbers, and dashes'
    return null
}

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
    const [checkingSlug, setCheckingSlug] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
    })

    const [errors, setErrors] = useState<Record<string, string | null>>({})

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
    }

    const handleNameChange = async (name: string) => {
        setFormData(prev => ({ ...prev, name }))
        setErrors(prev => ({ ...prev, name: validateName(name) }))

        const newSlug = generateSlug(name)
        setFormData(prev => ({ ...prev, slug: newSlug }))
        setErrors(prev => ({ ...prev, slug: validateSlug(newSlug) }))

        if (newSlug.length >= 3) {
            setCheckingSlug(true)
            const available = await checkSlugAvailability(newSlug)
            setSlugAvailable(available)
            setCheckingSlug(false)
        }
    }

    const handleSlugChange = async (slug: string) => {
        const cleanSlug = generateSlug(slug)
        setFormData(prev => ({ ...prev, slug: cleanSlug }))
        setErrors(prev => ({ ...prev, slug: validateSlug(cleanSlug) }))

        if (cleanSlug.length >= 3) {
            setCheckingSlug(true)
            const available = await checkSlugAvailability(cleanSlug)
            setSlugAvailable(available)
            setCheckingSlug(false)
        }
    }

    const handlePhoneChange = (phone: string) => {
        // Only allow numbers and + at the start
        const cleaned = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
        setFormData(prev => ({ ...prev, phone: cleaned }))
        setErrors(prev => ({ ...prev, phone: validatePhone(cleaned) }))
    }

    const handlePincodeChange = (pincode: string) => {
        // Only allow numbers
        const cleaned = pincode.replace(/\D/g, '').slice(0, 6)
        setFormData(prev => ({ ...prev, pincode: cleaned }))
        setErrors(prev => ({ ...prev, pincode: validatePincode(cleaned) }))
    }

    const validateStep1 = (): boolean => {
        const nameError = validateName(formData.name)
        const slugError = validateSlug(formData.slug)
        const phoneError = validatePhone(formData.phone)

        setErrors(prev => ({ ...prev, name: nameError, slug: slugError, phone: phoneError }))

        return !nameError && !slugError && !phoneError && slugAvailable !== false
    }

    const validateStep2 = (): boolean => {
        const pincodeError = validatePincode(formData.pincode)
        setErrors(prev => ({ ...prev, pincode: pincodeError }))
        return !pincodeError
    }

    const handleContinue = () => {
        if (validateStep1()) {
            setStep(2)
        }
    }

    const handleSubmit = async () => {
        if (!validateStep2()) return

        setIsLoading(true)
        const result = await createRestaurant(formData)
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            setStep(3)
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        }
    }

    const FieldError = ({ error }: { error?: string | null }) => {
        if (!error) return null
        return <p className="text-sm text-red-500 mt-1">{error}</p>
    }

    return (
        <div className="min-h-screen bg-muted/40 py-10">
            <div className="container mx-auto max-w-2xl px-4">
                {/* Progress Steps */}
                <div className="mb-8 flex justify-center">
                    <div className="flex items-center gap-4">
                        {STEPS.map((s, idx) => (
                            <div key={s.id} className="flex items-center">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${step >= s.id
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-muted-foreground/30 text-muted-foreground'
                                        }`}
                                >
                                    <s.icon className="h-5 w-5" />
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div
                                        className={`ml-4 h-0.5 w-16 ${step > s.id ? 'bg-primary' : 'bg-muted-foreground/30'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Let&apos;s set up your restaurant</CardTitle>
                            <CardDescription>
                                Enter your restaurant name to get started
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Restaurant Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Pizza Palace"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                <FieldError error={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Your Restaurant URL</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">foodos.com/</span>
                                    <Input
                                        id="slug"
                                        placeholder="pizza-palace"
                                        value={formData.slug}
                                        onChange={(e) => handleSlugChange(e.target.value)}
                                        className={errors.slug || slugAvailable === false ? 'border-red-500' : ''}
                                    />
                                </div>
                                <FieldError error={errors.slug} />
                                {!errors.slug && formData.slug.length >= 3 && (
                                    <p className={`text-sm ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                        {checkingSlug ? 'Checking...' : slugAvailable ? '✓ Available' : '✗ Already taken'}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Tell customers about your restaurant..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number (Optional)</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    value={formData.phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    className={errors.phone ? 'border-red-500' : ''}
                                />
                                <FieldError error={errors.phone} />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleContinue}
                            >
                                Continue
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Where is your restaurant?</CardTitle>
                            <CardDescription>
                                Add your outlet address (you can add more details later)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address_line1">Address Line 1</Label>
                                <Input
                                    id="address_line1"
                                    placeholder="Street address"
                                    value={formData.address_line1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                                <Input
                                    id="address_line2"
                                    placeholder="Apartment, floor, landmark..."
                                    value={formData.address_line2}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="Mumbai"
                                        value={formData.city}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        placeholder="Maharashtra"
                                        value={formData.state}
                                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pincode</Label>
                                <Input
                                    id="pincode"
                                    placeholder="400001"
                                    value={formData.pincode}
                                    onChange={(e) => handlePincodeChange(e.target.value)}
                                    className={errors.pincode ? 'border-red-500' : ''}
                                    maxLength={6}
                                />
                                <FieldError error={errors.pincode} />
                            </div>
                            {/* Location Picker Map */}
                            <div className="space-y-2">
                                <Label>Pin Your Location</Label>
                                <LocationPicker
                                    latitude={formData.latitude}
                                    longitude={formData.longitude}
                                    onLocationChange={(lat, lng) =>
                                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
                                    }
                                />
                            </div>

                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button className="flex-1" onClick={handleSubmit} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Restaurant
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
                            <p className="mt-2 text-muted-foreground">
                                Your restaurant has been created. Redirecting to dashboard...
                            </p>
                            <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-muted-foreground" />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
