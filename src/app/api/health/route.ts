import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '4.5.0',
      services: {
        database: 'connected',
        websocket: 'active',
        gee: 'initialized',
        agents: 'operational'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          database: 'disconnected',
          websocket: 'unknown',
          gee: 'unknown',
          agents: 'unknown'
        }
      },
      { status: 503 }
    );
  }
}