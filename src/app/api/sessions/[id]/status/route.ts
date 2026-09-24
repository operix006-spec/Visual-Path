import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await db.session.findUnique({
      where: { id },
      include: {
        images: {
          select: { id: true, processingStatus: true, aiClassification: true }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const totalImages = session.images.length;
    const processedImages = session.images.filter(img => img.processingStatus === 'COMPLETED' || img.processingStatus === 'FAILED').length;
    
    // Category distribution breakdown and sample thumbnail IDs
    const categories: Record<string, number> = {};
    const sampleImageIds: Record<string, string[]> = {};

    // Initialize custom categories with 0 count so user can see all configured categories
    if (session.customCategories && session.classificationType !== 'auto') {
      const definedList = session.customCategories.split(/[,،]/).map(c => c.trim()).filter(Boolean);
      for (const cat of definedList) {
        categories[cat] = 0;
        sampleImageIds[cat] = [];
      }
    }

    for (const img of session.images) {
      if (img.aiClassification) {
        categories[img.aiClassification] = (categories[img.aiClassification] || 0) + 1;
        if (!sampleImageIds[img.aiClassification]) {
          sampleImageIds[img.aiClassification] = [];
        }
        if (sampleImageIds[img.aiClassification].length < 4) {
          sampleImageIds[img.aiClassification].push(img.id);
        }
      }
    }

    return NextResponse.json({
      id: session.id,
      name: session.name,
      status: session.status,
      classificationType: session.classificationType,
      customCategories: session.customCategories,
      outputFilePath: session.outputFilePath,
      stats: {
        totalImages,
        processedImages,
        categories,
        sampleImageIds
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
