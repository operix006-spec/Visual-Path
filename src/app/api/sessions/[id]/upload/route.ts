import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StorageService } from '@/lib/services/storage';
import path from 'path';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const originalFilename = file.name;
    const ext = path.extname(originalFilename);
    const mimeType = file.type;
    const fileSize = file.size;

    // Create DB record to get the stable image ID
    const imageRecord = await db.image.create({
      data: {
        sessionId: id,
        originalFilename,
        originalPath: '', // Will update next
        fileSize,
        mimeType,
        processingStatus: 'PENDING',
      },
    });

    // Save using the stable ID
    const savedPath = await StorageService.saveOriginal(buffer, imageRecord.id, ext);

    // Update the record with the actual storage path
    await db.image.update({
      where: { id: imageRecord.id },
      data: { originalPath: savedPath },
    });

    return NextResponse.json({ success: true, imageId: imageRecord.id });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
