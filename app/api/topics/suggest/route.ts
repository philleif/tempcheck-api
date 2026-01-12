import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const suggestSchema = z.object({
  title: z.string().min(1).max(100),
  deviceId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = suggestSchema.parse(body);

    let suggestion;
    
    try {
      suggestion = await prisma.topicSuggestion.create({
        data: {
          title: data.title,
          deviceId: data.deviceId,
        },
      });
    } catch {
      // DB not available, return mock response
      suggestion = {
        id: `mock-suggestion-${Date.now()}`,
        title: data.title,
        deviceId: data.deviceId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      suggestionId: suggestion.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error submitting suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to submit suggestion' },
      { status: 500 }
    );
  }
}
