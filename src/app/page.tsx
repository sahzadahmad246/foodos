import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserDropdown } from '@/components/user-dropdown'
import { createClient } from '@/lib/supabase/server'
import { EmailChangeAlert } from '@/components/email-change-alert'
import {
  ArrowRight,
  BarChart3,
  Bike,
  Check,
  ChefHat,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  MessageCircle,
  PackageCheck,
  Play,
  ScanLine,
  Sparkles,
  Store,
  Users,
} from 'lucide-react'

const features = [
  { icon: ScanLine, title: 'One screen for every order', copy: 'Bring online, phone, and walk-in orders into one calm command center.' },
  { icon: BarChart3, title: 'Know what moves the needle', copy: 'See your best sellers, rush hours, and revenue in a glance.' },
  { icon: Users, title: 'Keep your whole crew in sync', copy: 'Give your kitchen, front-of-house, and riders the context they need.' },
]

const testimonials = [
  { quote: 'foodOS gave us back our evenings. The team knows what is happening before I even ask.', name: 'Maya Chen', role: 'Co-owner, North & Pine', initials: 'MC' },
  { quote: 'We stopped stitching together five different tools. Orders are faster and our guests notice.', name: 'Jordan Ellis', role: 'Operations, Hearth House', initials: 'JE' },
]

export default async function HomePage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const message = params?.message
  const isEmailChangePending = message?.toLowerCase().includes('confirm') && message?.toLowerCase().includes('other email')
  let userRole: 'owner' | 'rider' | 'user' = 'user'

  if (user) {
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).single()
    if (restaurant) userRole = 'owner'
    else {
      const { data: rider } = await supabase.from('riders').select('id').eq('email', user.email).eq('is_active', true).single()
      if (rider) userRole = 'rider'
    }
  }

  const accountAction = userRole === 'owner' ? { href: '/dashboard', label: 'Open dashboard', icon: LayoutDashboard } : userRole === 'rider' ? { href: '/rider', label: 'Rider dashboard', icon: Bike } : { href: '/onboarding', label: 'Start your restaurant', icon: ChefHat }

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-10 border-b border-border/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="font-mono text-xl font-bold tracking-[-0.08em]">food<span className="text-primary">OS</span><span className="ml-2 text-[10px] font-medium tracking-[0.2em] text-muted-foreground">RESTAURANT OS</span></Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#product" className="transition-colors hover:text-foreground">Product</a>
            <a href="#why-foodos" className="transition-colors hover:text-foreground">Why foodOS</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? <UserDropdown user={{ email: user.email, name: user.user_metadata?.full_name || user.user_metadata?.name, avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture }} /> : <><Link href="/login" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Log in</Link><Button asChild size="sm" className="rounded-full px-5"><Link href="/signup">Get started <ArrowRight data-icon="inline-end" /></Link></Button></>}
          </div>
        </div>
      </header>

      {isEmailChangePending && user && <EmailChangeAlert email={user.email} />}

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"><span className="size-1.5 rounded-full bg-primary" />The operating system for modern restaurants</div>
              <h1 className="max-w-2xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.07em] sm:text-6xl lg:text-7xl">Run a tighter ship.<br /><span className="text-primary">Serve more joy.</span></h1>
              <p className="mt-7 max-w-lg text-pretty text-lg leading-8 text-muted-foreground">The all-in-one restaurant platform for orders, menus, kitchen flow, and the numbers that keep your business moving.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="rounded-full px-7"><Link href={user ? accountAction.href : '/signup'}>{user ? accountAction.label : 'Start free today'} <ArrowRight data-icon="inline-end" /></Link></Button><Button asChild size="lg" variant="outline" className="rounded-full border-border/80 px-7"><a href="#product"><Play data-icon="inline-start" /> See how it works</a></Button></div>
              <div className="mt-9 flex items-center gap-4 text-xs text-muted-foreground"><div className="flex -space-x-2"><span className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground">MC</span><span className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-accent text-[10px] font-bold text-accent-foreground">JE</span><span className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-bold">RK</span></div><span><strong className="text-foreground">2,400+</strong> teams serving smarter</span></div>
            </div>
            <div id="product" className="relative lg:pl-8"><div className="absolute -inset-10 -z-10 bg-[radial-gradient(circle_at_center,var(--primary)/0.12,transparent_60%)]" /><div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /><span className="text-sm font-semibold">Good morning, Maya</span></div><span className="text-xs text-muted-foreground">Tuesday, Oct 24</span></div><div className="grid gap-4 p-5 sm:grid-cols-[1.3fr_0.7fr]"><div className="rounded-xl bg-secondary/70 p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Today&apos;s revenue</p><p className="mt-1 text-3xl font-semibold tracking-tight">$8,492.40</p></div><span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary">+18.4%</span></div><div className="mt-8 flex h-28 items-end gap-2">{[35, 46, 40, 62, 55, 78, 68, 93, 76, 100, 85, 96].map((height, index) => <span key={index} className="flex-1 rounded-t-sm bg-primary/80" style={{ height: `${height}%`, opacity: index < 6 ? 0.45 : 1 }} />)}</div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>8am</span><span>12pm</span><span>4pm</span><span>Now</span></div></div><div className="flex flex-col gap-4"><div className="rounded-xl bg-primary p-4 text-primary-foreground"><div className="flex items-center justify-between"><PackageCheck className="size-5" /><span className="text-xs opacity-75">Live now</span></div><p className="mt-5 text-3xl font-semibold">24</p><p className="text-xs opacity-80">orders in motion</p></div><div className="rounded-xl border border-border p-4"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Kitchen pulse</p><span className="size-2 rounded-full bg-primary" /></div><p className="mt-2 text-lg font-semibold">On track</p><p className="mt-1 text-[11px] text-muted-foreground">Avg. prep time 14 min</p></div></div></div><div className="border-t border-border/70 px-5 py-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Recent orders</p><button className="text-xs text-primary">View all <ChevronRight className="inline size-3" /></button></div><div className="mt-3 flex flex-col gap-3">{['#1048  ·  Table 12', '#1047  ·  Uber Eats', '#1046  ·  Table 04'].map((order, index) => <div key={order} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{order}</span><span className="flex items-center gap-1.5 font-medium"><span className={`size-1.5 rounded-full ${index === 1 ? 'bg-accent' : 'bg-primary'}`} />{index === 1 ? 'Preparing' : 'Ready'}</span></div>)}</div></div></div></div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-secondary/25"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 py-7 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70 lg:justify-between lg:px-8"><span>Built for teams at</span><span className="font-serif text-xl normal-case tracking-normal text-foreground/70">north & pine</span><span className="font-mono text-sm tracking-[-0.06em] text-foreground/70">HEARTH_HOUSE</span><span className="font-serif text-lg italic normal-case tracking-normal text-foreground/70">the common table</span><span className="text-foreground/70">SALT + STEM</span></div></section>

        <section id="why-foodos" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Everything in rhythm</p><h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Less tab-switching.<br />More <span className="text-primary">table time.</span></h2></div><div className="mt-14 grid gap-5 md:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-2xl border border-border bg-card p-7 transition-transform duration-300 hover:-translate-y-1"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><feature.icon className="size-5" /></div><h3 className="mt-8 text-xl font-semibold tracking-tight">{feature.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{feature.copy}</p><a href="#pricing" className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-primary">Explore the workflow <ArrowRight className="size-4" /></a></article>)}</div></section>

        <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8 lg:pb-32"><div className="grid gap-12 rounded-3xl bg-primary p-7 text-primary-foreground sm:p-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:p-16"><div><div className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground/15"><Sparkles className="size-5" /></div><h2 className="mt-8 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Your best shift<br />starts here.</h2><p className="mt-5 max-w-md leading-7 text-primary-foreground/75">A clearer view of your business means better decisions, happier teams, and guests who come back.</p><Button asChild variant="secondary" size="lg" className="mt-8 rounded-full px-7"><Link href={user ? accountAction.href : '/signup'}>Take a tour <ArrowRight data-icon="inline-end" /></Link></Button></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-primary-foreground/10 p-5"><Clock3 className="size-5" /><p className="mt-8 text-3xl font-semibold">14 min</p><p className="mt-1 text-sm text-primary-foreground/65">average prep time</p></div><div className="rounded-2xl bg-primary-foreground/10 p-5"><CircleDollarSign className="size-5" /><p className="mt-8 text-3xl font-semibold">+22%</p><p className="mt-1 text-sm text-primary-foreground/65">more repeat orders</p></div><div className="rounded-2xl bg-primary-foreground/10 p-5 sm:col-span-2"><MessageCircle className="size-5" /><p className="mt-5 text-lg font-semibold">One calm place to run the rush.</p><p className="mt-1 text-sm text-primary-foreground/65">From the first ticket to the last delivery.</p></div></div></div></section>

        <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8 lg:pb-32"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Good company</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Loved by people who care deeply.</h2></div><a href="#pricing" className="inline-flex items-center gap-2 text-sm font-medium text-primary">Read customer stories <ArrowRight className="size-4" /></a></div><div className="mt-10 grid gap-5 md:grid-cols-2">{testimonials.map((item) => <blockquote key={item.name} className="rounded-2xl border border-border bg-card p-7 sm:p-9"><div className="flex gap-1 text-primary">{[1,2,3,4,5].map((star) => <span key={star}>★</span>)}</div><p className="mt-7 max-w-xl text-xl leading-8 tracking-tight">&ldquo;{item.quote}&rdquo;</p><footer className="mt-8 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">{item.initials}</span><span><strong className="block text-sm">{item.name}</strong><span className="text-xs text-muted-foreground">{item.role}</span></span></footer></blockquote>)}</div></section>

        <section id="pricing" className="border-t border-border/60 bg-secondary/25"><div className="mx-auto max-w-7xl px-5 py-24 text-center lg:px-8 lg:py-32"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Make room for better</p><h2 className="mx-auto mt-5 max-w-3xl text-balance text-5xl font-semibold tracking-[-0.07em] sm:text-6xl">The next great service<br /><span className="text-primary">starts with foodOS.</span></h2><p className="mx-auto mt-6 max-w-lg leading-7 text-muted-foreground">Join the restaurant teams trading chaos for clarity. Your first 14 days are on us.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg" className="rounded-full px-8"><Link href={user ? accountAction.href : '/signup'}>Start free today <ArrowRight data-icon="inline-end" /></Link></Button><Button asChild size="lg" variant="outline" className="rounded-full px-8"><Link href="/login">Talk to our team</Link></Button></div><p className="mt-5 text-xs text-muted-foreground"><Check className="mr-1 inline size-3 text-primary" />No credit card required</p></div></section>
      </main>

      <footer className="border-t border-border/60"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><Link href="/" className="font-mono font-bold tracking-[-0.08em] text-foreground">food<span className="text-primary">OS</span></Link><p>Made for the people behind the table.</p><div className="flex items-center gap-5"><Link href="/login" className="hover:text-foreground">Log in</Link><Link href="/signup" className="hover:text-foreground">Get started</Link></div></div></footer>
    </div>
  )
}
