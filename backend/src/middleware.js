import { NextResponse } from 'next/server'
export function middleware(request) {
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || '*'

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
                'Access-Control-Max-Age': '86400',
            },
        })
    }

    // Handle regular requests
    const response = NextResponse.next()

    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version')

    return response
}

// Match only API routes
export const config = {
    matcher: '/api/:path*',
}
