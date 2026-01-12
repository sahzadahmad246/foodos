'use client'

import NextTopLoader from 'nextjs-toploader'

export function TopLoader() {
    return (
        <NextTopLoader
            color="#2563eb"
            height={4}
            showSpinner={false}
            speed={300}
            easing="ease"
            shadow="0 0 10px #2563eb,0 0 5px #2563eb"
        />
    )
}
