import { createClient } from '@supabase/supabase-js'
import { headers, cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  throw new Error('Missing Supabase environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Creates a Supabase client for server-side use with proper cookie handling.
 * 
 * Uses Supabase's recommended Next.js server-side pattern with cookie support.
 */
export function createServerClient() {
  const headersList = headers()
  const cookieStore = cookies()
  const authHeader = headersList.get('authorization')
  
  // Create client with cookie support
  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          // Try Authorization header first
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7)
            // Return a mock session-like structure for getSession()
            return JSON.stringify({ access_token: token })
          }
          
          // Then try cookies - Supabase uses sb-{project-ref}-auth-token
          const projectRef = url.split('//')[1]?.split('.')[0] || ''
          const cookieName = projectRef ? `sb-${projectRef}-auth-token` : null
          
          if (cookieName) {
            const cookie = cookieStore.get(cookieName)?.value
            if (cookie) {
              return cookie
            }
          }
          
          // Try all cookies that might contain auth token
          const allCookies = cookieStore.getAll()
          for (const cookie of allCookies) {
            if (cookie.name.includes('auth-token') || cookie.name.includes('sb-')) {
              return cookie.value
            }
          }
          
          return null
        },
        setItem: () => {}, // No-op for server
        removeItem: () => {}, // No-op for server
      },
    },
    global: {
      headers: authHeader?.startsWith('Bearer ')
        ? {
            Authorization: authHeader,
          }
        : {},
    },
  })

  return supabase
}

/**
 * Gets the current session from the request.
 * Returns null if no valid session is found.
 */
export async function getServerSession() {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  
  // If we have Authorization header, use it directly
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    
    // Create a client with the token to verify it
    const supabase = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    
    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    // Return a session-like object
    return {
      access_token: token,
      user,
      expires_at: null,
      expires_in: null,
      refresh_token: null,
      token_type: 'bearer',
    } as any
  }
  
  // Otherwise, try to get session from cookies
  const supabase = createServerClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }
  
  return session
}
