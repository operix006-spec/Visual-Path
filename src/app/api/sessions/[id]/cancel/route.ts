import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.session.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel session' }, { status: 500 });
  }
}
