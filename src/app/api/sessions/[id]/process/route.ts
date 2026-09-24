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
    const session = await db.session.findUnique({ where: { id: sessionId } });
    if (!session) return;

    const images = await db.image.findMany({
      where: { sessionId, processingStatus: 'PENDING' }
    });

    const isAuto = !session.classificationType || session.classificationType === 'auto';
    let categoriesList: string[] = [];
    if (!isAuto && session.customCategories) {
      categoriesList = session.customCategories.split(/[,،]/).map(c => c.trim()).filter(Boolean);
    }

    const aiProvider = getAIProvider();
    let instructions = '';

    if (isAuto || categoriesList.length === 0) {
      instructions = `You are an elite photoshoot art director and asset manager.
Analyze this photo and assign it to the SINGLE best matching photographic visual style:

1. 'Dynamic_Action_Splash': High-speed action, floating ingredients/elements, flying particles, splash, levitation, dynamic commercial shot.
2. 'Studio_Product': Clean product shot on studio backdrop (seamless white, black, or colored background), clean centered lighting.
3. 'Lifestyle_Context': Real-life context, hands holding the product, person with product, desk, table, café, counter, environmental lifestyle.
4. 'Macro_CloseUp': Extreme close-up shot focusing on texture, drips, ingredients, or fine product details.
5. 'Creative_Mood_Lighting': Dramatic shadows, colored/neon gel lights, cinematic dark moody atmosphere, artistic backlighting.

Choose the single best matching photographic style.`;
    } else {
      const catString = categoriesList.map((c, i) => `${i + 1}. '${c}'`).join('\n');
      instructions = `You are an elite photoshoot art director and asset manager. The photographer has organized this shoot into specific categories:

${catString}

Analyze this photo and assign it to the SINGLE best matching category from this list based on its visual content.
Choose the single best matching category. Return ONLY the category name.`;
    }

    for (const image of images) {
      // Check for cancellation before processing each image
      const currentSession = await db.session.findUnique({ where: { id: sessionId }, select: { status: true } });
      if (currentSession?.status === 'CANCELLED') {
        console.log(`Session ${sessionId} was cancelled by user.`);
        break;
      }

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

        const aiResult = await aiProvider.analyzeImage(
          optimizedPath,
          instructions,
          categoriesList.length > 0 ? categoriesList : undefined
        );

        await db.image.update({
          where: { id: image.id },
          data: { 
            processingStatus: 'COMPLETED',
            aiClassification: aiResult.classification,
            aiConfidence: aiResult.confidence,
            errorMessage: aiResult.metadata?.error ? String(aiResult.metadata.error) : null
          }
        });
      } catch (err) {
        console.error(`Error processing image ${image.id}:`, err);
        await db.image.update({
          where: { id: image.id },
          data: { 
            processingStatus: 'COMPLETED',
            aiClassification: 'Uncategorized',
            aiConfidence: 0.0,
            errorMessage: String(err)
          }
        });
      }

      // Pacing delay (3.5s) to stay safely within free-tier 15 RPM
      await new Promise(res => setTimeout(res, 3500));
    }

    const finalSession = await db.session.findUnique({ where: { id: sessionId }, select: { status: true } });
    if (finalSession?.status === 'CANCELLED') {
      return;
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
