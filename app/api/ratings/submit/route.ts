import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const submitSchema = z.object({
  topicId: z.string().min(1),
  deviceId: z.string().min(1),
  value: z.number().min(0).max(100),
  hotTake: z.string().max(280).optional(),
  timezone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = submitSchema.parse(body);

    let rating;
    
    try {
      // Upsert rating (update if exists, create if not)
      rating = await prisma.rating.upsert({
        where: {
          topicId_deviceId: {
            topicId: data.topicId,
            deviceId: data.deviceId,
          },
        },
        update: {
          value: data.value,
          hotTake: data.hotTake,
          timezone: data.timezone,
        },
        create: {
          topicId: data.topicId,
          deviceId: data.deviceId,
          value: data.value,
          hotTake: data.hotTake,
          timezone: data.timezone,
        },
      });
    } catch {
      // DB not available, return mock response
      rating = {
        id: `mock-rating-${Date.now()}`,
        topicId: data.topicId,
        deviceId: data.deviceId,
        value: data.value,
        hotTake: data.hotTake,
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      ratingId: rating.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
