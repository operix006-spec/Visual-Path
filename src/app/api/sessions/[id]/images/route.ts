import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const images = await db.image.findMany({
      where: { sessionId: id },
      select: {
        id: true,
        originalFilename: true,
        aiClassification: true,
        aiConfidence: true,
        processingStatus: true,
        errorMessage: true,
        fileSize: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
