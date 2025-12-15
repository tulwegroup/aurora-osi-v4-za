import { NextRequest, NextResponse } from 'next/server';
import { getGEEService } from '@/lib/google-earth-engine';

// Global settings storage (in production, this would be in environment variables or database)
let globalSettings: any = {
  geeConfig: {
    serviceAccountKey: '',
    projectId: '',
    isEnabled: false
  },
  dataSource: {
    primary: 'mock',
    fallbackEnabled: true,
    cacheEnabled: true,
    cacheDuration: 24
  },
  consensusThreshold: 0.85,
  enableVeto: true,
  processingTimeout: 300000
};

// POST /api/settings/apply - Apply settings to the system
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();

    // Update global settings
    globalSettings = { ...globalSettings, ...settings };

    // Configure GEE service if enabled
    if (settings.geeConfig?.isEnabled && settings.geeConfig?.serviceAccountKey) {
      try {
        const geeService = getGEEService({
          serviceAccountKey: settings.geeConfig.serviceAccountKey,
          projectId: settings.geeConfig.projectId,
          earthEngineEndpoint: 'https://earthengine.googleapis.com/v1'
        });

        await geeService.initialize();
        console.log('GEE service configured with real credentials');
      } catch (error) {
        console.error('Failed to configure GEE service:', error);
        return NextResponse.json({
          success: false,
          message: `Failed to configure GEE service: ${error.message}`
        }, { status: 500 });
      }
    }

    // Update consensus engine settings
    try {
      // This would update the consensus engine configuration
      // For now, we'll just log the settings
      console.log('Consensus settings updated:', {
        threshold: settings.consensusThreshold,
        vetoEnabled: settings.enableVeto,
        timeout: settings.processingTimeout
      });
    } catch (error) {
      console.error('Failed to update consensus settings:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings applied successfully',
      details: {
        dataSource: settings.dataSource?.primary,
        geeEnabled: settings.geeConfig?.isEnabled,
        consensusThreshold: settings.consensusThreshold,
        vetoEnabled: settings.enableVeto
      }
    });

  } catch (error) {
    console.error('Settings application error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to apply settings',
      details: {
        error: error.message
      }
    }, { status: 500 });
  }
}

// GET /api/settings - Get current settings
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      settings: globalSettings
    });
  } catch (error) {
    console.error('Settings retrieval error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve settings',
      details: {
        error: error.message
      }
    }, { status: 500 });
  }
}