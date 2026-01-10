import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import {
    Store,
    MapPin,
    Phone,
    FileText,
    Clock,
    Truck,
    CreditCard,
    CheckCircle,
    XCircle,
    Power,
    Mail,
    Globe,
    IndianRupee,
    Utensils,
    ImageIcon
} from 'lucide-react'
import { EditBasicInfoDialog } from '@/components/dashboard/outlet/edit-basic-info'
import { EditAddressDialog } from '@/components/dashboard/outlet/edit-address'
import { EditContactDialog } from '@/components/dashboard/outlet/edit-contact'
import { EditBusinessDialog } from '@/components/dashboard/outlet/edit-business'
import { EditDeliveryDialog } from '@/components/dashboard/outlet/edit-delivery'
import { EditOperatingHoursDialog } from '@/components/dashboard/outlet/edit-operating-hours'
import { ToggleSetting } from '@/components/dashboard/outlet/toggle-setting'
import { ImageUploader } from '@/components/dashboard/outlet/image-uploader'
import { calculateProfileCompletion, canGoOnline } from '@/lib/profile-completion'

export const dynamic = 'force-dynamic'

// Section Component - full width on mobile, clean header
function Section({ icon: Icon, title, children, action }: {
    icon: any,
    title: string,
    children: React.ReactNode,
    action?: React.ReactNode
}) {
    return (
        <section className="bg-card border-y md:border md:rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">{title}</h3>
                </div>
                {action}
            </div>
            <div className="p-4">
                {children}
            </div>
        </section>
    )
}

// Info Item - simple label/value pair
function InfoItem({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: any }) {
    return (
        <div className="py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </div>
            <div className="text-sm font-medium">{value || <span className="text-muted-foreground italic font-normal">Not set</span>}</div>
        </div>
    )
}

export default async function OutletPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .single()

    if (!restaurant) {
        return <div className="p-4 text-center">Restaurant not found</div>
    }

    const { data: settings } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .single()

    const settingsData = settings || {}
    const { percentage } = calculateProfileCompletion(restaurant, settingsData)
    const { allowed: canGoOnlineStatus } = canGoOnline(restaurant)

    const formatTime = (time: string) => {
        if (!time) return 'Not set'
        const [h, m] = time.split(':')
        const hour = parseInt(h)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const hour12 = hour % 12 || 12
        return `${hour12}:${m} ${ampm}`
    }

    return (
        <div className="space-y-3 md:space-y-4 -mx-4 md:mx-0 pb-6">
            {/* Cover & Logo */}
            <Section icon={ImageIcon} title="Images">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Cover Image</p>
                        <ImageUploader
                            restaurantId={restaurant.id}
                            type="cover"
                            currentUrl={restaurant.cover_image_url}
                            currentPublicId={restaurant.cover_public_id}
                        />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Logo</p>
                        <ImageUploader
                            restaurantId={restaurant.id}
                            type="logo"
                            currentUrl={restaurant.logo_url}
                            currentPublicId={restaurant.logo_public_id}
                        />
                    </div>
                </div>
            </Section>

            {/* Basic Info */}
            <Section icon={Store} title="Basic Information" action={<EditBasicInfoDialog restaurant={restaurant} />}>
                <div className="grid md:grid-cols-2 gap-x-6">
                    <InfoItem icon={Globe} label="URL" value={`foodos.com/${restaurant.slug}`} />
                    <InfoItem icon={FileText} label="Description" value={restaurant.description} />
                    <div className="md:col-span-2 py-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Utensils className="h-3 w-3" /> Cuisine Type
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {restaurant.cuisine_type?.length > 0 ? (
                                restaurant.cuisine_type.map((c: string) => (
                                    <Badge key={c} variant="secondary" className="font-normal text-xs">{c}</Badge>
                                ))
                            ) : (
                                <span className="text-muted-foreground italic text-sm">Not set</span>
                            )}
                        </div>
                    </div>
                </div>
            </Section>

            {/* Contact */}
            <Section icon={Phone} title="Contact" action={<EditContactDialog restaurant={restaurant} />}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                    <InfoItem icon={Phone} label="Primary Phone" value={restaurant.phone} />
                    <InfoItem icon={Phone} label="Secondary" value={restaurant.phone_secondary} />
                    <InfoItem icon={Mail} label="Email" value={restaurant.email} />
                </div>
            </Section>

            {/* Address */}
            <Section icon={MapPin} title="Address" action={<EditAddressDialog restaurant={restaurant} />}>
                <InfoItem
                    icon={MapPin}
                    label="Full Address"
                    value={[restaurant.address_line1, restaurant.address_line2, restaurant.city, restaurant.state, restaurant.pincode]
                        .filter(Boolean)
                        .join(', ') || null}
                />
                {restaurant.latitude && restaurant.longitude && (
                    <InfoItem
                        label="Coordinates"
                        value={`${Number(restaurant.latitude).toFixed(6)}, ${Number(restaurant.longitude).toFixed(6)}`}
                    />
                )}
            </Section>

            {/* Business Details */}
            <Section icon={FileText} title="Business Details" action={<EditBusinessDialog restaurantId={restaurant.id} settings={settingsData} />}>
                <div className="grid grid-cols-2 gap-x-4">
                    <InfoItem
                        label="GST Registered"
                        value={
                            <span className="flex items-center gap-1">
                                {settingsData.has_gst ? (
                                    <><CheckCircle className="h-3 w-3 text-green-600" /> Yes ({settingsData.gst_percentage}%)</>
                                ) : (
                                    <><XCircle className="h-3 w-3 text-muted-foreground" /> No</>
                                )}
                            </span>
                        }
                    />
                    {settingsData.gst_number && <InfoItem label="GSTIN" value={settingsData.gst_number} />}
                    <InfoItem label="FSSAI" value={settingsData.fssai_number} />
                </div>
            </Section>

            {/* Delivery */}
            <Section icon={Truck} title="Delivery" action={<EditDeliveryDialog restaurantId={restaurant.id} settings={settingsData} />}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                        { label: 'Radius', value: `${settingsData.delivery_radius_km || 5} km` },
                        { label: 'Min Order', value: `₹${settingsData.min_order_amount || 0}` },
                        { label: 'Delivery Fee', value: `₹${settingsData.delivery_fee || 0}` },
                        { label: 'Free Above', value: settingsData.free_delivery_above ? `₹${settingsData.free_delivery_above}` : '—' },
                    ].map(item => (
                        <div key={item.label} className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Hours */}
            <Section icon={Clock} title="Hours" action={<EditOperatingHoursDialog restaurantId={restaurant.id} settings={settingsData} />}>
                <div className="flex flex-wrap gap-3 mb-3">
                    <div>
                        <span className="text-xs text-muted-foreground">Opens: </span>
                        <Badge variant="outline">{formatTime(settingsData.opening_time)}</Badge>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground">Closes: </span>
                        <Badge variant="outline">{formatTime(settingsData.closing_time)}</Badge>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <Badge
                            key={day}
                            variant={(settingsData.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).includes(day) ? 'default' : 'outline'}
                            className="text-xs"
                        >
                            {day}
                        </Badge>
                    ))}
                </div>
            </Section>

            {/* Payment */}
            <Section icon={CreditCard} title="Payment">
                <div className="grid md:grid-cols-2 gap-2">
                    <ToggleSetting
                        restaurantId={restaurant.id}
                        settingName="cod_enabled"
                        label="Cash on Delivery"
                        description="Accept cash"
                        enabled={settingsData.cod_enabled ?? true}
                    />
                    <ToggleSetting
                        restaurantId={restaurant.id}
                        settingName="online_payment_enabled"
                        label="Online Payments"
                        description="UPI, cards"
                        enabled={settingsData.online_payment_enabled ?? false}
                    />
                </div>
            </Section>

            {/* Quick Settings */}
            <Section icon={Power} title="Quick Settings">
                <div className="grid md:grid-cols-2 gap-2">
                    <ToggleSetting
                        restaurantId={restaurant.id}
                        settingName="is_active"
                        label="Go Online"
                        description="Accept orders"
                        enabled={restaurant.is_active}
                        isRestaurantField={true}
                        requiresProfileComplete={true}
                        profileComplete={canGoOnlineStatus}
                    />
                    <ToggleSetting
                        restaurantId={restaurant.id}
                        settingName="auto_accept_orders"
                        label="Auto Accept"
                        description="Auto-accept orders"
                        enabled={settingsData.auto_accept_orders ?? false}
                    />
                </div>
            </Section>
        </div>
    )
}
