import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ImageService } from '@/lib/services/image';
import { getAIProvider } from '@/lib/services/ai';

import { PackagerService } from '@/lib/services/packager';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.session.update({
      where: { id },
      data: { status: 'PROCESSING' }
    });
    
    // Start background processing without awaiting
    processSession(id).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start processing' }, { status: 500 });
  }
}

async function processSession(sessionId: string) {
  try {
    const images = await db.image.findMany({
      where: { sessionId, processingStatus: 'PENDING' }
    });

    for (const image of images) {
      // 1. Optimize
      await db.image.update({
        where: { id: image.id },
        data: { processingStatus: 'OPTIMIZING' }
      });

      try {
        const optimizedPath = await ImageService.createOptimizedCopy(image.originalPath, image.id);
        
        // 2. AI Analysis
        await db.image.update({
          where: { id: image.id },
          data: { 
            processingStatus: 'ANALYZING',
            analysisPath: optimizedPath
          }
        });

        const aiProvider = getAIProvider();
        const instructions = `You are a professional photoshoot art director. Classify this photo into its photographic visual style:

1. 'Dynamic_Action_Splash': High-speed action, floating ingredients/elements, flying particles, splash, levitation, dynamic commercial shot.
2. 'Studio_Product': Clean product shot on studio backdrop (seamless white, black, or colored background), clean centered lighting.
3. 'Lifestyle_Context': Real-life context, hands holding the product, person with product, desk, table, café, counter, environmental lifestyle.
4. 'Macro_CloseUp': Extreme close-up shot focusing on texture, drips, ingredients, or fine product details.
5. 'Creative_Mood_Lighting': Dramatic shadows, colored/neon gel lights, cinematic dark moody atmosphere, artistic backlighting.

Choose the single best matching photographic style.`;

        const aiResult = await aiProvider.analyzeImage(optimizedPath, instructions);

        await db.image.update({
          where: { id: image.id },
          data: { 
            processingStatus: 'COMPLETED',
            aiClassification: aiResult.classification,
            aiConfidence: aiResult.confidence
          }
        });
      } catch (err) {
        console.error(`Error processing image ${image.id}:`, err);
        await db.image.update({
          where: { id: image.id },
          data: { 
            processingStatus: 'COMPLETED',
            aiClassification: 'Studio_Product',
            aiConfidence: 0.5,
            errorMessage: String(err)
          }
        });
      }

      // Small pacing delay to prevent hitting rate limit bursts
      await new Promise(res => setTimeout(res, 600));
    }

    // Mark as building output
    await db.session.update({
      where: { id: sessionId },
      data: { status: 'BUILDING_OUTPUT' }
    });

    await PackagerService.generateZip(sessionId);
  } catch (err) {
    console.error("Packaging or session failed:", err);
    await db.session.update({
      where: { id: sessionId },
      data: { status: 'FAILED' }
    });
  }
}
