import { headers } from 'next/headers'

export async function getSiteUrl() {
    const headerStore = await headers()
    const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')

    if (!host) {
        return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }

    const forwardedProto = headerStore.get('x-forwarded-proto')
    const isLocal = host.includes('localhost') || host.startsWith('127.0.0.1')
    const proto = forwardedProto ?? (isLocal ? 'http' : 'https')

    return `${proto}://${host}`
}
