import { NextRequest, NextResponse } from 'next/server'

const TAMBO_API_KEY = process.env.TAMBO_API_KEY
const TAMBO_API_URL = process.env.TAMBO_API_URL || 'https://api.tambo.co'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, 'PUT')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, 'PATCH')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params, 'DELETE')
}

async function handleRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  // Check for server-side API key
  if (!TAMBO_API_KEY) {
    console.error('[Tambo Proxy] TAMBO_API_KEY is missing from server environment')
    console.error('[Tambo Proxy] Set TAMBO_API_KEY in .env.local (server-side, no NEXT_PUBLIC_ prefix)')
    return NextResponse.json(
      { error: 'Tambo API key not configured on server. Set TAMBO_API_KEY in .env.local' },
      { status: 500 }
    )
  }

  // Log API key status (first few chars only for debugging)
  if (process.env.NODE_ENV === 'development') {
    const keyPreview = TAMBO_API_KEY.substring(0, 8) + '...'
    console.log('[Tambo Proxy] API key status:', {
      hasKey: !!TAMBO_API_KEY,
      keyLength: TAMBO_API_KEY.length,
      keyPreview,
      apiUrl: TAMBO_API_URL,
    })
  }

  const { path } = await params
  const pathSegments = path || []
  const tamboPath = pathSegments.join('/')
  const url = new URL(request.url)
  const searchParams = url.searchParams.toString()
  
  // Build Tambo API URL - handle both with and without trailing slash
  const baseUrl = TAMBO_API_URL.endsWith('/') ? TAMBO_API_URL.slice(0, -1) : TAMBO_API_URL
  const tamboPathWithSlash = tamboPath.startsWith('/') ? tamboPath : `/${tamboPath}`
  const tamboUrl = `${baseUrl}${tamboPathWithSlash}${searchParams ? `?${searchParams}` : ''}`

  // Log request details
  console.log(`[Tambo Proxy] ${method} ${tamboPath}`, {
    hasQuery: !!searchParams,
    url: tamboUrl.replace(TAMBO_API_KEY, '[REDACTED]'),
  })

  try {
    // Get request body if present
    let body: string | undefined
    const contentType = request.headers.get('content-type')
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text()
      } catch {
        // No body
      }
    }

    // Forward request to Tambo API
    // Use the same auth pattern as the official Tambo SDK
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${TAMBO_API_KEY}`,
      'Content-Type': contentType || 'application/json',
      'Accept': 'application/json',
    }

    // Forward relevant headers from client
    const clientHeaders = Object.fromEntries(
      Array.from(request.headers.entries()).filter(([key]) =>
        ['x-tambo-react-version', 'user-agent', 'accept'].includes(key.toLowerCase())
      )
    )
    Object.assign(headers, clientHeaders)

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tambo Proxy] Forwarding request:', {
        method,
        url: tamboUrl.replace(TAMBO_API_KEY, '[REDACTED]'),
        hasAuth: !!headers.Authorization,
        contentType: headers['Content-Type'],
      })
    }

    const response = await fetch(tamboUrl, {
      method,
      headers,
      body,
    })

    const responseContentType = response.headers.get('content-type') || ''
    const statusCode = response.status

    // Log response details
    console.log(`[Tambo Proxy] Response: ${statusCode}`, {
      contentType: responseContentType,
      isStreaming: responseContentType.includes('text/event-stream') || responseContentType.includes('stream'),
    })

    // Handle auth errors with detailed diagnostics
    if (statusCode === 401 || statusCode === 403) {
      // Try to get error message from Tambo API
      let errorText = ''
      let errorJson: any = null
      try {
        const text = await response.text()
        errorText = text.substring(0, 500)
        try {
          errorJson = JSON.parse(text)
        } catch {
          // Not JSON
        }
      } catch {
        // Ignore
      }

      console.error('[Tambo Proxy] Auth error (403/401) - detailed diagnostics:', {
        status: statusCode,
        url: tamboPath,
        tamboApiUrl: TAMBO_API_URL,
        hasApiKey: !!TAMBO_API_KEY,
        apiKeyLength: TAMBO_API_KEY?.length || 0,
        errorResponse: errorText,
        errorJson,
      })

      // Provide helpful error message
      const errorMessage = errorJson?.error || errorText || 'Authentication failed'
      return NextResponse.json(
        { 
          error: errorMessage,
          details: 'Check that TAMBO_API_KEY is set correctly in .env.local (server-side, no NEXT_PUBLIC_ prefix)',
        },
        { status: statusCode }
      )
    }

    // Handle streaming responses
    if (responseContentType.includes('text/event-stream') || responseContentType.includes('stream')) {
      if (!response.body) {
        console.error('[Tambo Proxy] Streaming response has no body')
        return NextResponse.json(
          { error: 'Streaming response failed' },
          { status: 500 }
        )
      }

      return new NextResponse(response.body, {
        status: statusCode,
        headers: {
          'Content-Type': responseContentType,
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Handle JSON responses
    if (responseContentType.includes('application/json')) {
      const json = await response.json()
      
      if (statusCode >= 400) {
        console.error('[Tambo Proxy] Error response:', {
          status: statusCode,
          error: JSON.stringify(json).substring(0, 300),
        })
      }

      return NextResponse.json(json, { status: statusCode })
    }

    // Handle other response types
    const text = await response.text()
    
    if (statusCode >= 400) {
      console.error('[Tambo Proxy] Error response:', {
        status: statusCode,
        contentType: responseContentType,
        preview: text.substring(0, 300),
      })
    }

    return new NextResponse(text, {
      status: statusCode,
      headers: {
        'Content-Type': responseContentType,
      },
    })
  } catch (error) {
    console.error('[Tambo Proxy] Request failed:', {
      error: error instanceof Error ? error.message : String(error),
      url: tamboPath,
      method,
    })

    return NextResponse.json(
      {
        error: 'Failed to proxy request to Tambo API',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
