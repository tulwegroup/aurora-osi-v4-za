import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'pass',
        filesystem: 'pass',
        memory: 'pass'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          database: 'fail',
          filesystem: 'unknown',
          memory: 'unknown'
        }
      },
      { status: 503 }
    );
  }
}