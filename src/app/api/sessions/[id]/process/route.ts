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

    const isAuto = !session.classificationType || session.classificationType === 'auto';
    let categoriesList = [];
    if (!isAuto && session.customCategories) {
      categoriesList = session.customCategories.split(',').map(c => c.trim()).filter(Boolean);
    }

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
        let instructions = '';
        let defaultCategory = 'Studio_Product';

        if (isAuto || categoriesList.length === 0) {
          instructions = `You are a professional photoshoot art director. Classify this photo into its photographic visual style:

1. 'Dynamic_Action_Splash': High-speed action, floating ingredients/elements, flying particles, splash, levitation, dynamic commercial shot.
2. 'Studio_Product': Clean product shot on studio backdrop (seamless white, black, or colored background), clean centered lighting.
3. 'Lifestyle_Context': Real-life context, hands holding the product, person with product, desk, table, café, counter, environmental lifestyle.
4. 'Macro_CloseUp': Extreme close-up shot focusing on texture, drips, ingredients, or fine product details.
5. 'Creative_Mood_Lighting': Dramatic shadows, colored/neon gel lights, cinematic dark moody atmosphere, artistic backlighting.

Choose the single best matching photographic style.`;
        } else {
          const catString = categoriesList.map((c, i) => `${i + 1}. '${c}'`).join('\n');
          instructions = `You are a professional photoshoot art director. The photographer has defined the following specific categories for this shoot based on ${session.classificationType}:

${catString}

Look at this image and assign it to EXACTLY one of these categories based on its visual features. If it perfectly matches none, assign it to the closest one.
Choose the single best matching category. Return ONLY the category name.`;
          defaultCategory = categoriesList[0];
        }

        const aiResult = await aiProvider.analyzeImage(optimizedPath, instructions);
        
        // Ensure the AI returned one of the requested categories (if not auto)
        let finalClassification = aiResult.classification;
        if (!isAuto && categoriesList.length > 0) {
           const matched = categoriesList.find(c => c.toLowerCase() === finalClassification.toLowerCase());
           finalClassification = matched || defaultCategory;
        }

        await db.image.update({
          where: { id: image.id },
          data: { 
            processingStatus: 'COMPLETED',
            aiClassification: finalClassification,
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
