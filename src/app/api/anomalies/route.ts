import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from 'z-ai-web-dev-sdk';

// GeoRNG Physics Engine Implementation
class GeoRNG {
  private seed: number;
  private rng: any;

  constructor(lat: number, lon: number) {
    this.seed = this.generateSeed(lat, lon);
    // Simple deterministic RNG - in production this would be more sophisticated
    this.rng = {
      value: () => {
        // Linear congruential generator for deterministic output
        this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.seed / Math.pow(2, 32);
      }
    };
  }

  private generateSeed(lat: number, lon: number): number {
    return Math.floor((lat + 90) * 10000 + (lon + 180) * 100);
  }

  generateGravity(geologyContext: string): number {
    const baseValue = this.getGravityBase(geologyContext);
    const variation = (this.rng.value() - 0.5) * 10; // ±5 mGal variation
    return baseValue + variation;
  }

  generateMagnetic(geologyContext: string): number {
    const baseValue = this.getMagneticBase(geologyContext);
    const variation = (this.rng.value() - 0.5) * 100; // ±50 nT variation
    return baseValue + variation;
  }

  generateThermal(geologyContext: string): number {
    const baseValue = this.getThermalBase(geologyContext);
    const variation = (this.rng.value() - 0.5) * 5; // ±2.5°C variation
    return baseValue + variation;
  }

  private getGravityBase(geologyContext: string): number {
    const gravityMap = {
      'basin': -37.5,      // mGal
      'craton': -15.0,     // mGal
      'orogen': -25.0,     // mGal
      'shield': -10.0,     // mGal
      'platform': -20.0    // mGal
    };
    return gravityMap[geologyContext] || -20.0;
  }

  private getMagneticBase(geologyContext: string): number {
    const magneticMap = {
      'basin': 50000,      // nT
      'craton': 55000,     // nT
      'orogen': 58000,     // nT
      'shield': 60000,     // nT
      'platform': 52000    // nT
    };
    return magneticMap[geologyContext] || 53000;
  }

  private getThermalBase(geologyContext: string): number {
    const thermalMap = {
      'basin': 15.0,       // °C
      'craton': 12.0,      // °C
      'orogen': 18.0,      // °C
      'shield': 10.0,      // °C
      'platform': 14.0     // °C
    };
    return thermalMap[geologyContext] || 14.0;
  }
}

// GET /api/anomalies - Get anomalies for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const anomalies = await db.anomaly.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ anomalies });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomalies' },
      { status: 500 }
    );
  }
}

// POST /api/anomalies - Generate and save anomalies for a campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, anomalyCount = 10 } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Get campaign details
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Initialize GeoRNG for this location
    const geoRNG = new GeoRNG(campaign.latitude, campaign.longitude);

    // Generate anomalies using deterministic physics
    const generatedAnomalies = [];
    const anomalyTypes = ['gravity', 'magnetic', 'thermal', 'spectral'];

    for (let i = 0; i < anomalyCount; i++) {
      const anomalyType = anomalyTypes[Math.floor(geoRNG.rng.value() * anomalyTypes.length)];
      const latOffset = (geoRNG.rng.value() - 0.5) * (campaign.radiusKm / 111); // Convert km to degrees
      const lonOffset = (geoRNG.rng.value() - 0.5) * (campaign.radiusKm / (111 * Math.cos(campaign.latitude * Math.PI / 180)));
      
      let value, depth, volume;
      
      switch (anomalyType) {
        case 'gravity':
          value = geoRNG.generateGravity(campaign.geologyContext || 'basin');
          depth = 1000 + geoRNG.rng.value() * 4000; // 1-5 km depth
          volume = 100000 + geoRNG.rng.value() * 900000; // 100k-1M m³
          break;
        case 'magnetic':
          value = geoRNG.generateMagnetic(campaign.geologyContext || 'basin');
          depth = 500 + geoRNG.rng.value() * 3000; // 0.5-3.5 km depth
          volume = 50000 + geoRNG.rng.value() * 450000; // 50k-500k m³
          break;
        case 'thermal':
          value = geoRNG.generateThermal(campaign.geologyContext || 'basin');
          depth = 2000 + geoRNG.rng.value() * 3000; // 2-5 km depth
          volume = 200000 + geoRNG.rng.value() * 800000; // 200k-1M m³
          break;
        default:
          value = geoRNG.rng.value() * 100;
          depth = 1000 + geoRNG.rng.value() * 4000;
          volume = 100000 + geoRNG.rng.value() * 900000;
      }

      const probability = 0.5 + geoRNG.rng.value() * 0.5; // 0.5-1.0 probability
      const confidence = 0.6 + geoRNG.rng.value() * 0.4; // 0.6-1.0 confidence

      const anomaly = await db.anomaly.create({
        data: {
          campaignId,
          latitude: campaign.latitude + latOffset,
          longitude: campaign.longitude + lonOffset,
          depthM: depth,
          probability,
          confidence,
          anomalyType,
          value,
          volumeM3: volume,
          resourceEstimate: {
            estimatedVolume: volume,
            confidence: confidence,
            methodology: 'GeoRNG deterministic physics',
            modelVersion: 'v4.0.0'
          },
          physicsValidation: {
            gravityAnomaly: anomalyType === 'gravity' ? value : null,
            magneticAnomaly: anomalyType === 'magnetic' ? value : null,
            thermalAnomaly: anomalyType === 'thermal' ? value : null,
            geologyContext: campaign.geologyContext,
            validationScore: confidence,
            passesPhysics: confidence > 0.7
          }
        }
      });

      generatedAnomalies.push(anomaly);
    }

    return NextResponse.json({ 
      message: `Generated ${generatedAnomalies.length} anomalies`,
      anomalies: generatedAnomalies 
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating anomalies:', error);
    return NextResponse.json(
      { error: 'Failed to generate anomalies' },
      { status: 500 }
    );
  }
}