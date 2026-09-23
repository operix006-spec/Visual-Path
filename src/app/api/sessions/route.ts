import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name || 'New Shoot';
    const classificationType = body.classificationType || 'auto';
    const customCategories = body.customCategories || null;

    const session = await db.session.create({
      data: {
        name,
        status: 'UPLOADING',
        classificationType,
        customCategories,
      },
    });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
