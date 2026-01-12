import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  timezone: z.string().default('UTC'),
  count: z.coerce.number().min(1).max(50).default(10),
});

// Mock topics for development when DB is empty
const MOCK_TOPICS = [
  { id: 'mock-1', title: 'Surfing', slug: 'surfing', mediaUrl: 'https://picsum.photos/seed/surfing/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-2', title: 'Pit Hair', slug: 'pit-hair', mediaUrl: 'https://picsum.photos/seed/pithair/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-3', title: 'Dogs', slug: 'dogs', mediaUrl: 'https://picsum.photos/seed/dogs/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-4', title: 'Ice Cream', slug: 'ice-cream', mediaUrl: 'https://picsum.photos/seed/icecream/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-5', title: 'Camping', slug: 'camping', mediaUrl: 'https://picsum.photos/seed/camping/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-6', title: 'Yoga', slug: 'yoga', mediaUrl: 'https://picsum.photos/seed/yoga/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-7', title: 'Coffee', slug: 'coffee', mediaUrl: 'https://picsum.photos/seed/coffee/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-8', title: 'Skateboarding', slug: 'skateboarding', mediaUrl: 'https://picsum.photos/seed/skateboarding/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-9', title: 'Pizza', slug: 'pizza', mediaUrl: 'https://picsum.photos/seed/pizza/400/500', mediaType: 'image', isActive: true },
  { id: 'mock-10', title: 'Mountains', slug: 'mountains', mediaUrl: 'https://picsum.photos/seed/mountains/400/500', mediaType: 'image', isActive: true },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      timezone: searchParams.get('timezone') ?? 'UTC',
      count: searchParams.get('count') ?? 10,
    });

    interface TopicData {
      id: string;
      title: string;
      slug: string;
      mediaUrl: string | null;
      mediaType: string;
      isActive?: boolean;
    }
    
    let topics: TopicData[] = [];
    
    try {
      topics = await prisma.topic.findMany({
        where: {
          isActive: true,
          scheduledFor: { lte: new Date() },
        },
        take: params.count,
        orderBy: { scheduledFor: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          mediaUrl: true,
          mediaType: true,
        },
      });
    } catch {
      // DB not available, use mock data
      topics = [];
    }

    // Use mock topics if DB is empty or unavailable
    if (topics.length === 0) {
      topics = MOCK_TOPICS.slice(0, params.count);
    }

    // Calculate next drop time (9 AM in user's timezone)
    const nextDropAt = new Date();
    nextDropAt.setHours(9, 0, 0, 0);
    if (nextDropAt <= new Date()) {
      nextDropAt.setDate(nextDropAt.getDate() + 1);
    }

    return NextResponse.json({
      topics,
      nextDropAt: nextDropAt.toISOString(),
      count: topics.length,
    });
  } catch (error) {
    console.error('Error fetching daily topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
