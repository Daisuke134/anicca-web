import { createClient } from '@/lib/supabase'

// Get auth headers for API requests
export async function getAuthHeaders() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return {}
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`
  }
}

// Authenticated fetch wrapper
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const authHeaders = await getAuthHeaders()
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...authHeaders
    }
  })
}