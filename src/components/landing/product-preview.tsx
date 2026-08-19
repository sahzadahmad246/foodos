function KotSlip({
    no,
    table,
    name,
    lines,
    time,
    pay,
    rotate,
    z,
}: {
    no: string
    table: string
    name: string
    lines: string[]
    time: string
    pay: string
    rotate: string
    z: string
}) {
    return (
        <article
            className={`absolute w-[228px] bg-[#f6efd8] px-4 pb-4 pt-3 text-[#1c1410] shadow-[4px_10px_24px_rgba(28,20,16,0.18)] sm:w-[242px] ${rotate} ${z}`}
        >
            <div className="mb-3 border-b border-dashed border-[#1c1410]/30 pb-2">
                <div className="flex items-center justify-between font-mono text-[10px] tracking-widest uppercase text-[#1c1410]/55">
                    <span>KOT {no}</span>
                    <span>{table}</span>
                </div>
            </div>
            <p className="font-serif text-xl leading-none">{name}</p>
            <ul className="mt-3 space-y-1 font-mono text-[11px] leading-relaxed text-[#1c1410]/80">
                {lines.map((line) => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#1c1410]/30 pt-2 font-mono text-[10px] uppercase tracking-wider text-[#1c1410]/55">
                <span>{time}</span>
                <span>{pay}</span>
            </div>
        </article>
    )
}

export function TicketStack() {
    return (
        <div className="relative mx-auto h-[400px] w-full max-w-[520px] sm:h-[460px]">
            <KotSlip
                no="1038"
                table="Tbl 04"
                name="Farhan"
                lines={['1  Chicken dum biryani', '1  Mirchi ka salan', '1  Burani raita']}
                time="8:11 pm"
                pay="Paid"
                rotate="-rotate-[8deg] left-0 top-8"
                z="z-10"
            />
            <KotSlip
                no="1040"
                table="Deliv."
                name="Priya S."
                lines={['1  Hyderabadi biryani', '2  Rumali roti', '1  Sweet lassi']}
                time="8:29 pm"
                pay="COD"
                rotate="rotate-[4deg] right-2 top-2"
                z="z-20"
            />
            <KotSlip
                no="1042"
                table="New"
                name="Ayesha K."
                lines={['1  Butter chicken', '2  Garlic naan', '1  Masala coke']}
                time="8:42 pm"
                pay="COD"
                rotate="-rotate-[2deg] left-8 top-[7.5rem]"
                z="z-30"
            />
        </div>
    )
}

const BOARD_TICKETS = [
    { id: '1042', name: 'Ayesha K.', items: 'Butter chicken, garlic naan ×2', amount: '₹420', col: 'New', wait: '2m' },
    { id: '1041', name: 'Rahul M.', items: 'Paneer tikka, coke', amount: '₹310', col: 'Prep', wait: '11m' },
    { id: '1040', name: 'Priya S.', items: 'Biryani, raita', amount: '₹280', col: 'Pass', wait: 'Ready' },
    { id: '1039', name: 'Imran', items: 'Mutton nihari, khameeri', amount: '₹540', col: 'Out', wait: 'Rider' },
]

export function KitchenPass() {
    return (
        <div className="border border-white/10 bg-[#171310] text-[#f3ead8]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#f3ead8]/45">Pass · Pyare Mohan</p>
                    <p className="mt-1 font-serif text-2xl">Tonight’s service</p>
                </div>
                <p className="font-mono text-[11px] text-emerald-400/90">● kitchen live · 8:44 pm</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                {BOARD_TICKETS.map((ticket) => (
                    <article key={ticket.id} className="border-t border-white/10 p-5 sm:border-l sm:border-t-0 sm:first:border-l-0 lg:border-l lg:first:border-l-0">
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#f3ead8]/45">
                            <span>#{ticket.id}</span>
                            <span>{ticket.col}</span>
                        </div>
                        <p className="mt-4 font-serif text-2xl leading-none">{ticket.name}</p>
                        <p className="mt-3 text-sm leading-relaxed text-[#f3ead8]/65">{ticket.items}</p>
                        <div className="mt-6 flex items-end justify-between">
                            <span className="font-mono text-sm">{ticket.amount}</span>
                            <span className="font-mono text-[11px] text-[#e3b341]">{ticket.wait}</span>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}
