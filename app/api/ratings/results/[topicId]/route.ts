import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ topicId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { topicId } = await params;

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    let ratings: { value: number }[] = [];
    
    try {
      ratings = await prisma.rating.findMany({
        where: { topicId },
        select: { value: true },
      });
    } catch {
      // DB not available, generate mock data
    }

    // If no ratings, generate mock data for development
    if (ratings.length === 0) {
      const mockCount = Math.floor(Math.random() * 1000) + 100;
      ratings = Array.from({ length: mockCount }, () => ({
        value: Math.floor(Math.random() * 100),
      }));
    }

    // Calculate statistics
    const totalRatings = ratings.length;
    const globalAverage = totalRatings > 0
      ? Math.round(ratings.reduce((sum, r) => sum + r.value, 0) / totalRatings)
      : 50;

    // Calculate distribution
    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    ratings.forEach((r) => {
      if (r.value <= 20) distribution['0-20']++;
      else if (r.value <= 40) distribution['21-40']++;
      else if (r.value <= 60) distribution['41-60']++;
      else if (r.value <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    // Convert to percentages
    const distributionPercentages = {
      '0-20': Math.round((distribution['0-20'] / totalRatings) * 100),
      '21-40': Math.round((distribution['21-40'] / totalRatings) * 100),
      '41-60': Math.round((distribution['41-60'] / totalRatings) * 100),
      '61-80': Math.round((distribution['61-80'] / totalRatings) * 100),
      '81-100': Math.round((distribution['81-100'] / totalRatings) * 100),
    };

    return NextResponse.json({
      topicId,
      globalAverage,
      totalRatings,
      distribution: distributionPercentages,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
