import Link from 'next/link'
import Image from 'next/image'
import { Clock, MapPin, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmailChangeAlert } from '@/components/email-change-alert'
import { LandingHeader, type LandingUser } from '@/components/landing/landing-header'
import { KitchenPass, TicketStack } from '@/components/landing/product-preview'

export type LandingUserRole = 'owner' | 'rider' | 'user'

export type LandingRestaurant = {
    id: string
    name: string
    slug: string
    logo_url: string | null
    cover_image_url: string | null
    description: string | null
    cuisine_type: string[] | null
    city: string | null
    state: string | null
    restaurant_settings: unknown
}

const MARQUEE = [
    '#1042  Ayesha  ·  Butter chicken  ·  COD  ₹420',
    '#1041  Rahul  ·  Paneer tikka  ·  Paid  ₹310',
    '#1040  Priya  ·  Biryani  ·  COD  ₹280',
    'Imran  ·  out for delivery  ·  cash to collect',
    'KOT printed  ·  table 04  ·  Farhan',
    'Menu updated  ·  garlic naan  ·  86’d',
    '#1038  Nihari  ·  rider assigned',
    'New order ping  ·  8:42 pm  ·  accept?',
]

const SERVICE = [
    {
        no: '01',
        title: 'The board',
        body: 'Orders land as tickets, not screenshots. Accept, print a KOT, and move them down the pass without shouting across the line.',
    },
    {
        no: '02',
        title: 'The docket',
        body: 'Your menu is a live page — photos, prices, 86 the dum aloo when it runs out. Customers order from a link you already send on WhatsApp.',
    },
    {
        no: '03',
        title: 'The riders',
        body: 'Assign the bike that’s free. They collect cash, mark delivered, and you see who still has money in the bag.',
    },
    {
        no: '04',
        title: 'The till',
        body: 'COD and Razorpay. No American “pay later”. The kitchen gets paid the way the neighbourhood actually pays.',
    },
]

function ctaForRole(role: LandingUserRole, loggedIn: boolean) {
    if (!loggedIn) return { href: '/signup', label: 'Open a kitchen' }
    if (role === 'owner') return { href: '/dashboard', label: 'Back to the board' }
    if (role === 'rider') return { href: '/rider', label: 'Open rider sheet' }
    return { href: '/onboarding', label: 'Start your restaurant' }
}

export function HomeLanding({
    user,
    userRole,
    isEmailChangePending,
    onlineRestaurants,
}: {
    user: LandingUser | null
    userRole: LandingUserRole
    isEmailChangePending: boolean
    onlineRestaurants: LandingRestaurant[]
}) {
    const cta = ctaForRole(userRole, !!user)
    const featured = onlineRestaurants[0]

    return (
        <div className="min-h-screen bg-[#efe7d6] text-[#1c1410]">
            <LandingHeader user={user} ctaHref={cta.href} ctaLabel={cta.label} />

            {isEmailChangePending && user && (
                <EmailChangeAlert email={user.email} />
            )}

            <section className="mx-auto grid max-w-[1120px] items-center gap-12 px-4 pb-8 pt-14 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:pt-20">
                <div className="lg:col-span-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#c4452a]">
                        Table 01 · service on
                    </p>
                    <h1 className="mt-5 font-serif text-[2.7rem] leading-[0.95] tracking-tight sm:text-6xl lg:text-[4.4rem]">
                        WhatsApp is not a{' '}
                        <em className="italic text-[#c4452a]">kitchen display.</em>
                    </h1>
                    <p className="mt-6 max-w-md text-[17px] leading-relaxed text-[#1c1410]/70">
                        foodOS is the board, the docket, and the rider sheet — for restaurants that take their own orders, collect cash, and send their own bikes.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <Link
                            href={cta.href}
                            className="bg-[#c4452a] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f7f0e4] transition-colors hover:bg-[#a83822]"
                        >
                            {cta.label}
                        </Link>
                        <a href="#kitchens" className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#1c1410]/70 underline decoration-[#1c1410]/25 underline-offset-4 hover:text-[#1c1410]">
                            Or just order dinner
                        </a>
                    </div>
                </div>
                <div className="lg:col-span-6">
                    <TicketStack />
                </div>
            </section>

            <div className="border-y border-[#1c1410]/10 bg-[#1c1410] py-3 overflow-hidden">
                <div className="landing-marquee-track flex w-max gap-10 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.18em] text-[#f3ead8]/80">
                    {[...MARQUEE, ...MARQUEE].map((item, i) => (
                        <span key={`${item}-${i}`} className="flex items-center gap-10">
                            {item}
                            <span className="text-[#e3b341]">/</span>
                        </span>
                    ))}
                </div>
            </div>

            <section className="mx-auto grid max-w-[1120px] gap-0 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
                <div className="border border-[#1c1410]/15 bg-[#e7dcc4] p-8 sm:p-10">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#1c1410]/45">Tonight, without it</p>
                    <h2 className="mt-3 font-serif text-3xl sm:text-4xl">The group chat is the POS.</h2>
                    <ul className="mt-8 space-y-4 text-[15px] leading-relaxed text-[#1c1410]/75">
                        <li>“Bhai 2 butter naan, no onion, address I’ll send.”</li>
                        <li>Screenshot of a menu from 2019. Prices are wrong.</li>
                        <li>Rider calls: “Kaunsa order? Cash kitna?”</li>
                        <li>Kitchen finds out when someone yells from the counter.</li>
                    </ul>
                </div>
                <div className="border border-[#1c1410] bg-[#1c1410] p-8 text-[#f3ead8] sm:p-10 lg:-ml-px">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#e3b341]">Tonight, with foodOS</p>
                    <h2 className="mt-3 font-serif text-3xl sm:text-4xl">A ticket hits the pass.</h2>
                    <ul className="mt-8 space-y-4 text-[15px] leading-relaxed text-[#f3ead8]/75">
                        <li>Order #1042 · Ayesha · butter chicken · garlic naan ×2.</li>
                        <li>KOT prints. Board shows pending → prep → ready.</li>
                        <li>Imran is assigned. Cash to collect: ₹420.</li>
                        <li>Customer already has a link. No PDF, no “menu pic”.</li>
                    </ul>
                </div>
            </section>

            <section id="board" className="scroll-mt-24 bg-[#171310] py-16 sm:py-24">
                <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
                    <div className="mb-10 max-w-2xl">
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#e3b341]">The pass</p>
                        <h2 className="mt-3 font-serif text-4xl leading-[1.05] text-[#f3ead8] sm:text-5xl">
                            Built like the line, not like a startup dashboard.
                        </h2>
                        <p className="mt-4 max-w-lg text-[#f3ead8]/60">
                            New tickets, the pass, riders on the road. If you’ve stood next to a heat lamp, you’ll know where to look.
                        </p>
                    </div>
                    <KitchenPass />
                </div>
            </section>

            <section id="service" className="scroll-mt-24 mx-auto max-w-[1120px] px-4 py-20 sm:px-6 sm:py-28">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#c4452a]">On the floor</p>
                <h2 className="mt-3 max-w-xl font-serif text-4xl leading-[1.05] sm:text-5xl">
                    Four stations. That’s the whole product.
                </h2>
                <div className="mt-14 divide-y divide-[#1c1410]/15 border-y border-[#1c1410]/15">
                    {SERVICE.map((item) => (
                        <div key={item.no} className="grid gap-3 py-8 sm:grid-cols-[88px_1fr_1.4fr] sm:items-baseline sm:gap-8">
                            <p className="font-mono text-xs text-[#c4452a]">{item.no}</p>
                            <h3 className="font-serif text-2xl sm:text-3xl">{item.title}</h3>
                            <p className="text-[15px] leading-relaxed text-[#1c1410]/70">{item.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="kitchens" className="scroll-mt-24 border-t border-[#1c1410]/10 bg-[#e7dcc4] py-20 sm:py-28">
                <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#c4452a]">Open kitchens</p>
                            <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Dinner is actually on.</h2>
                        </div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#1c1410]/50">
                            {onlineRestaurants.length} live tonight
                        </p>
                    </div>

                    {onlineRestaurants.length === 0 ? (
                        <div className="mt-12 border border-dashed border-[#1c1410]/25 px-6 py-16 text-center">
                            <p className="font-serif text-2xl">No kitchen is taking orders right now.</p>
                            <p className="mt-2 text-sm text-[#1c1410]/60">Yours could be first.</p>
                            <Link
                                href={cta.href}
                                className="mt-6 inline-block bg-[#c4452a] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f7f0e4]"
                            >
                                {cta.label}
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-12 space-y-5">
                            {featured && (
                                <FeaturedKitchen restaurant={featured} />
                            )}
                            {onlineRestaurants.length > 1 && (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {onlineRestaurants.slice(1).map((restaurant) => (
                                        <KitchenCard key={restaurant.id} restaurant={restaurant} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6 sm:py-24">
                <div className="border border-[#1c1410]/15 bg-[#f6efd8] px-6 py-12 sm:px-12 sm:py-16">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#c4452a]">Cover for tonight</p>
                    <h2 className="mt-4 max-w-xl font-serif text-4xl leading-[1.05] sm:text-5xl">
                        Put a real ticket printer between you and the group chat.
                    </h2>
                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <Link
                            href={cta.href}
                            className="bg-[#c4452a] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f7f0e4] hover:bg-[#a83822]"
                        >
                            {cta.label}
                        </Link>
                        {!user && (
                            <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#1c1410]/60 underline decoration-[#1c1410]/20 underline-offset-4">
                                I already have a station
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-[#1c1410]/15">
                <div className="mx-auto max-w-[1120px] px-4 py-10 font-mono text-[11px] uppercase tracking-[0.16em] text-[#1c1410]/55 sm:px-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-serif text-xl normal-case tracking-tight text-[#1c1410]">foodOS</p>
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                            <a href="#board" className="hover:text-[#1c1410]">The board</a>
                            <a href="#service" className="hover:text-[#1c1410]">Service</a>
                            <a href="#kitchens" className="hover:text-[#1c1410]">Kitchens</a>
                            <Link href="/login" className="hover:text-[#1c1410]">Log in</Link>
                            <Link href="/signup" className="hover:text-[#1c1410]">Open a kitchen</Link>
                        </div>
                    </div>
                    <p className="mt-8 border-t border-dashed border-[#1c1410]/20 pt-4">
                        Thank you — come again
                    </p>
                </div>
            </footer>
        </div>
    )
}

function kitchenMeta(restaurant: LandingRestaurant) {
    const settingsRaw = restaurant.restaurant_settings as { delivery_fee?: number; min_order_amount?: number }[] | { delivery_fee?: number; min_order_amount?: number } | null
    const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw
    const cuisines = (restaurant.cuisine_type || []).slice(0, 3)
    const location = [restaurant.city, restaurant.state].filter(Boolean).join(', ')
    return { settings, cuisines, location }
}

function FeaturedKitchen({ restaurant }: { restaurant: LandingRestaurant }) {
    const { settings, cuisines, location } = kitchenMeta(restaurant)
    return (
        <Link
            href={`/r/${restaurant.slug}`}
            className="group grid overflow-hidden border border-[#1c1410]/15 bg-[#efe7d6] md:grid-cols-2"
        >
            <div className="relative min-h-[220px] bg-[#d9c9a8]">
                {restaurant.cover_image_url ? (
                    <Image
                        src={restaurant.cover_image_url}
                        alt={restaurant.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="h-full w-full bg-[repeating-linear-gradient(135deg,#e2d3b3,#e2d3b3_12px,#efe7d6_12px,#efe7d6_24px)]" />
                )}
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c4452a]">Now serving</p>
                <h3 className="mt-3 font-serif text-4xl leading-none">{restaurant.name}</h3>
                {location && (
                    <p className="mt-3 flex items-center gap-1 text-sm text-[#1c1410]/60">
                        <MapPin className="h-3.5 w-3.5" />
                        {location}
                    </p>
                )}
                {restaurant.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#1c1410]/70">{restaurant.description}</p>
                )}
                {cuisines.length > 0 && (
                    <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#1c1410]/50">
                        {cuisines.join(' · ')}
                    </p>
                )}
                <div className="mt-6 flex gap-5 font-mono text-[11px] uppercase tracking-wider text-[#1c1410]/50">
                    <span className="inline-flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        {settings?.delivery_fee ? `₹${Number(settings.delivery_fee).toFixed(0)}` : 'Delivery'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Min ₹{Number(settings?.min_order_amount || 0).toFixed(0)}
                    </span>
                </div>
            </div>
        </Link>
    )
}

function KitchenCard({ restaurant }: { restaurant: LandingRestaurant }) {
    const { settings, cuisines, location } = kitchenMeta(restaurant)
    return (
        <Link
            href={`/r/${restaurant.slug}`}
            className="group overflow-hidden border border-[#1c1410]/15 bg-[#efe7d6] transition-colors hover:bg-[#f6efd8]"
        >
            <div className="relative h-36 bg-[#d9c9a8]">
                {restaurant.cover_image_url ? (
                    <Image src={restaurant.cover_image_url} alt={restaurant.name} fill className="object-cover" />
                ) : (
                    <div className="h-full w-full bg-[repeating-linear-gradient(135deg,#e2d3b3,#e2d3b3_12px,#efe7d6_12px,#efe7d6_24px)]" />
                )}
            </div>
            <div className="p-4">
                <h3 className="font-serif text-2xl leading-none">{restaurant.name}</h3>
                {location && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-[#1c1410]/55">
                        <MapPin className="h-3.5 w-3.5" />
                        {location}
                    </p>
                )}
                {cuisines.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {cuisines.map((cuisine) => (
                            <Badge key={cuisine} variant="secondary" className="rounded-none bg-[#1c1410]/5 text-[10px] uppercase tracking-wide">
                                {cuisine}
                            </Badge>
                        ))}
                    </div>
                )}
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[#1c1410]/45">
                    {settings?.delivery_fee ? `₹${Number(settings.delivery_fee).toFixed(0)} delivery` : 'Delivery'} · min ₹{Number(settings?.min_order_amount || 0).toFixed(0)}
                </p>
            </div>
        </Link>
    )
}
