import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerSession } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const id = searchParams.get('id')

    const supabase = createServerClient()

    // If ID is provided, return single session
    if (id) {
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!sessionData) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      return NextResponse.json({ session: sessionData })
    }

    // Otherwise, return list of sessions
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum)
      }
    }

    const { data: sessions, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, state } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!state || typeof state !== 'object') {
      return NextResponse.json(
        { error: 'State (BrainState) is required and must be an object' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data: sessionData, error } = await supabase
      .from('sessions')
      .insert({
        user_id: session.user.id,
        title,
        state,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session: sessionData }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
