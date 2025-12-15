import { NextRequest, NextResponse } from 'next/server';
import { getGEEService } from '@/lib/google-earth-engine';

// POST /api/settings/test-gee - Test GEE connection
export async function POST(request: NextRequest) {
  try {
    const { serviceAccountKey, projectId } = await request.json();

    if (!serviceAccountKey || !projectId) {
      return NextResponse.json({
        success: false,
        message: 'Service account key and project ID are required'
      }, { status: 400 });
    }

    // Test GEE connection by initializing service with provided credentials
    const geeService = getGEEService({
      serviceAccountKey,
      projectId,
      earthEngineEndpoint: 'https://earthengine.googleapis.com/v1'
    });

    try {
      const initialized = await geeService.initialize();
      
      if (initialized) {
        // Test basic data retrieval
        const testData = await geeService.performGravityAnalysis(30.0, -90.0, 50);
        
        return NextResponse.json({
          success: true,
          message: 'Google Earth Engine connection successful!',
          details: {
            initialized: true,
            testDataAvailable: !!testData,
            dataSource: testData?.metadata?.source || 'mock',
            collections: geeService.getAvailableCollections().map(c => c.id)
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to initialize Google Earth Engine service',
          details: {
            initialized: false
          }
        });
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: `GEE connection failed: ${error.message}`,
        details: {
          error: error.message,
          type: 'connection_error'
        }
      });
    }
  } catch (error) {
    console.error('GEE test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to test GEE connection',
      details: {
        error: error.message
      }
    }, { status: 500 });
  }
}