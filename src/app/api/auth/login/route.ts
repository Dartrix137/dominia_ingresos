import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, setSessionCookie, verifyPin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN requerido' }, { status: 400 });
    }

    const ok = await verifyPin(pin.trim());
    if (!ok) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    const token = await createSession();
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
