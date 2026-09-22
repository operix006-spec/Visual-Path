import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const session = await db.session.findUnique({ where: { id } });

    if (!session || !session.outputFilePath || !fs.existsSync(session.outputFilePath)) {
      return NextResponse.json({ error: 'ZIP file not found or not ready' }, { status: 404 });
    }

    const fileStream = fs.createReadStream(session.outputFilePath);
    const stat = fs.statSync(session.outputFilePath);

    return new NextResponse(fileStream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${(session.name || 'organized_shoot').replace(/[^a-z0-9_-]/gi, '_')}.zip"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to download ZIP' }, { status: 500 });
  }
}
