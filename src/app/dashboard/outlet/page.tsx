import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
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
    Utensils,
    ImageIcon,
} from "lucide-react"
import { EditBasicInfoDialog } from "@/components/dashboard/outlet/edit-basic-info"
import { EditAddressDialog } from "@/components/dashboard/outlet/edit-address"
import { EditContactDialog } from "@/components/dashboard/outlet/edit-contact"
import { EditBusinessDialog } from "@/components/dashboard/outlet/edit-business"
import { EditDeliveryDialog } from "@/components/dashboard/outlet/edit-delivery"
import { EditOperatingHoursDialog } from "@/components/dashboard/outlet/edit-operating-hours"
import { ToggleSetting } from "@/components/dashboard/outlet/toggle-setting"
import { ImageUploader } from "@/components/dashboard/outlet/image-uploader"
import { EditPaymentKeysDialog } from "@/components/dashboard/outlet/edit-payment-keys"
import { OnlinePaymentToggle } from "@/components/dashboard/outlet/online-payment-toggle"
import { calculateProfileCompletion, canGoOnline } from "@/lib/profile-completion"

export const dynamic = "force-dynamic"

function Section({
    icon: Icon,
    title,
    children,
    action,
}: {
    icon: any
    title: string
    children: React.ReactNode
    action?: React.ReactNode
}) {
    return (
        <section className="relative bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-muted/40 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                    <h3 className="font-semibold text-base text-foreground truncate">{title}</h3>
                </div>
                {action && <div className="ml-2 flex-shrink-0">{action}</div>}
            </div>
            <div className="relative px-4 sm:px-6 py-5">
                {children}
            </div>
            {/* Bottom glow - CRED style */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-12 blur-2xl"
                style={{
                    background: 'rgba(117, 242, 190, 0.4)',
                }}
            />
        </section>
    )
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {Icon && <Icon className="h-4 w-4" />}
                {label}
            </div>
            <div className="text-sm sm:text-base font-medium text-foreground">
                {value || <span className="text-muted-foreground italic font-normal">Not set</span>}
            </div>
        </div>
    )
}

function GridInfo({ items }: { items: Array<{ label: string; value: React.ReactNode; icon?: any }> }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item, idx) => (
                <InfoItem key={idx} {...item} />
            ))}
        </div>
    )
}

export default async function OutletPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: restaurant } = await supabase.from("restaurants").select("*").eq("owner_id", user?.id).single()

    if (!restaurant) {
        return <div className="p-4 text-center">Restaurant not found</div>
    }

    const { data: settings } = await supabase
        .from("restaurant_settings")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .single()

    const settingsData = settings || {}
    const { percentage } = calculateProfileCompletion(restaurant, settingsData)
    const { allowed: canGoOnlineStatus } = canGoOnline(restaurant)

    const formatTime = (time: string) => {
        if (!time) return "Not set"
        const [h, m] = time.split(":")
        const hour = Number.parseInt(h)
        const ampm = hour >= 12 ? "PM" : "AM"
        const hour12 = hour % 12 || 12
        return `${hour12}:${m} ${ampm}`
    }

    return (
        <div className="w-full space-y-4 pb-8">
            {/* Cover & Logo */}
            <Section icon={ImageIcon} title="Images">
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-semibold text-foreground block mb-3">Cover Image</label>
                        <ImageUploader
                            restaurantId={restaurant.id}
                            type="cover"
                            currentUrl={restaurant.cover_image_url}
                            currentPublicId={restaurant.cover_public_id}
                        />
                    </div>
                    <div className="border-t border-border pt-6">
                        <label className="text-sm font-semibold text-foreground block mb-3">Logo</label>
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
                <div className="space-y-6">
                    <GridInfo
                        items={[
                            { icon: Globe, label: "Website URL", value: `foodos.com/${restaurant.slug}` },
                            { icon: FileText, label: "Description", value: restaurant.description },
                        ]}
                    />

                    <div className="border-t border-border pt-6">
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                            <Utensils className="h-4 w-4" /> Cuisine Type
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {restaurant.cuisine_type?.length > 0 ? (
                                restaurant.cuisine_type.map((c: string) => (
                                    <Badge key={c} variant="secondary" className="font-medium">
                                        {c}
                                    </Badge>
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
                <GridInfo
                    items={[
                        { icon: Phone, label: "Primary Phone", value: restaurant.phone || "Not set" },
                        { icon: Phone, label: "Secondary Phone", value: restaurant.phone_secondary || "Not set" },
                        { icon: Mail, label: "Email", value: restaurant.email || "Not set" },
                    ]}
                />
            </Section>

            {/* Address */}
            <Section icon={MapPin} title="Address" action={<EditAddressDialog restaurant={restaurant} />}>
                <div className="space-y-6">
                    <InfoItem
                        icon={MapPin}
                        label="Full Address"
                        value={
                            [
                                restaurant.address_line1,
                                restaurant.address_line2,
                                restaurant.city,
                                restaurant.state,
                                restaurant.pincode,
                            ]
                                .filter(Boolean)
                                .join(", ") || null
                        }
                    />
                    {restaurant.latitude && restaurant.longitude && (
                        <div className="border-t border-border pt-6">
                            <InfoItem
                                label="Coordinates"
                                value={`${Number(restaurant.latitude).toFixed(6)}, ${Number(restaurant.longitude).toFixed(6)}`}
                            />
                        </div>
                    )}
                </div>
            </Section>

            {/* Business Details */}
            <Section
                icon={FileText}
                title="Business Details"
                action={<EditBusinessDialog restaurantId={restaurant.id} settings={settingsData} />}
            >
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 sm:pb-5 border-b border-border">
                        <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                GST Registered
                            </div>
                            <div className="flex items-center gap-2">
                                {settingsData.has_gst ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium">Yes ({settingsData.gst_percentage}%)</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium">No</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <GridInfo
                        items={[
                            { label: "GSTIN", value: settingsData.gst_number || "Not set" },
                            { label: "FSSAI Number", value: settingsData.fssai_number || "Not set" },
                        ]}
                    />
                </div>
            </Section>

            {/* Delivery */}
            <Section
                icon={Truck}
                title="Delivery"
                action={<EditDeliveryDialog restaurantId={restaurant.id} settings={settingsData} />}
            >
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { label: "Delivery Radius", value: `${settingsData.delivery_radius_km || 5} km` },
                        { label: "Min Order", value: `₹${settingsData.min_order_amount || 0}` },
                        { label: "Delivery Fee", value: `₹${settingsData.delivery_fee || 0}` },
                        {
                            label: "Free Above",
                            value: settingsData.free_delivery_above ? `₹${settingsData.free_delivery_above}` : "—",
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg p-3 sm:p-4 border border-border/50 text-center hover:bg-muted/50 transition-colors"
                        >
                            <p className="text-lg sm:text-xl font-bold text-foreground">{item.value}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">{item.label}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Hours */}
            <Section
                icon={Clock}
                title="Operating Hours"
                action={<EditOperatingHoursDialog restaurantId={restaurant.id} settings={settingsData} />}
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/40 rounded-lg p-4 border border-border">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Opens</p>
                            <p className="text-lg font-bold text-foreground">{formatTime(settingsData.opening_time)}</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-4 border border-border">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Closes</p>
                            <p className="text-lg font-bold text-foreground">{formatTime(settingsData.closing_time)}</p>
                        </div>
                    </div>

                    <div className="border-t border-border pt-5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Operating Days</p>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                <div key={day} className="text-center">
                                    <Badge
                                        variant={
                                            (settingsData.working_days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]).includes(day)
                                                ? "default"
                                                : "outline"
                                        }
                                        className="w-full justify-center font-semibold py-2"
                                    >
                                        {day}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* Payment */}
            <Section icon={CreditCard} title="Payment Methods">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ToggleSetting
                        restaurantId={restaurant.id}
                        settingName="cod_enabled"
                        label="Cash on Delivery"
                        description="Accept cash payments"
                        enabled={settingsData.cod_enabled ?? true}
                    />
                    <OnlinePaymentToggle
                        restaurantId={restaurant.id}
                        enabled={settingsData.online_payment_enabled ?? false}
                        hasRazorpayKeys={!!settingsData.razorpay_key_id}
                        razorpayKeyId={settingsData.razorpay_key_id}
                    />
                </div>

                {/* Razorpay Keys */}
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Razorpay Payment Gateway</p>
                            <p className="text-xs text-muted-foreground">
                                {settingsData.razorpay_key_id ? (
                                    <span className="text-green-600">✓ Keys configured</span>
                                ) : (
                                    'Setup required for online payments'
                                )}
                            </p>
                        </div>
                        <EditPaymentKeysDialog
                            restaurantId={restaurant.id}
                            hasKeys={!!settingsData.razorpay_key_id}
                            keyId={settingsData.razorpay_key_id}
                        />
                    </div>
                </div>
            </Section>

            {/* Quick Settings */}
            <Section icon={Power} title="Quick Settings">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ToggleSetting
                        restaurantId={restaurant.id}
                        settingName="is_active"
                        label="Go Online"
                        description="Accept new orders"
                        enabled={restaurant.is_active}
                        isRestaurantField={true}
                        requiresProfileComplete={true}
                        profileComplete={canGoOnlineStatus}
                    />
                    <ToggleSetting
                        restaurantId={restaurant.id}
                        settingName="auto_accept_orders"
                        label="Auto Accept Orders"
                        description="Automatically accept incoming orders"
                        enabled={settingsData.auto_accept_orders ?? false}
                    />
                </div>
            </Section>
        </div>
    )
}
