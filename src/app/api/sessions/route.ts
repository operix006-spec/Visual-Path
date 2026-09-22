import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name } = await req.json().catch(() => ({ name: 'New Shoot' }));
    const session = await db.session.create({
      data: {
        name: name || 'New Shoot',
        status: 'UPLOADING',
      },
    });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
