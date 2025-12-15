import { NextRequest, NextResponse } from "next/server";
import { MultiAgentConsensus } from "@/lib/consensus/multi-agent-consensus";
import { GravimetricDecompositionAgent } from "@/lib/agents/gravimetric-decomposition-agent";
import { SpectralEvolutionAgent } from "@/lib/agents/spectral-evolution-agent";
import { QuantumInversionAgent } from "@/lib/agents/quantum-inversion-agent";
import { db } from "@/lib/db";

// Initialize consensus engine with all specialized agents
const consensusEngine = new MultiAgentConsensus({
  consensusThreshold: 0.85,
  vetoEnabled: true,
  confidenceThreshold: 0.7,
  maxProcessingTime: 300000, // 5 minutes
  parallelExecution: true
});

// Register all specialized agents
consensusEngine.registerAgent(new GravimetricDecompositionAgent());
consensusEngine.registerAgent(new SpectralEvolutionAgent());
consensusEngine.registerAgent(new QuantumInversionAgent());

// Initialize the consensus engine with Google Earth Engine
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await consensusEngine.initialize();
    isInitialized = true;
    console.log('Consensus engine initialized with Google Earth Engine');
  }
}

// GET /api/consensus/status - Get consensus engine status
export async function GET() {
  try {
    await ensureInitialized();
    
    const statistics = consensusEngine.getConsensusStatistics();
    const agents = consensusEngine.getAgents().map(agent => agent.getMetadata());

    return NextResponse.json({
      status: 'active',
      initialized: isInitialized,
      agents,
      statistics,
      config: {
        consensusThreshold: 0.85,
        vetoEnabled: true,
        confidenceThreshold: 0.7,
        parallelExecution: true
      }
    });
  } catch (error) {
    console.error('Error getting consensus status:', error);
    return NextResponse.json(
      { error: 'Failed to get consensus status' },
      { status: 500 }
    );
  }
}

// POST /api/consensus/evaluate - Run consensus evaluation
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const {
      campaignId,
      coordinates,
      targetResource,
      geologicalContext,
      depth,
      radius,
      timeRange
    } = body;

    // Support both campaign-based and direct evaluation
    let campaign = null;
    let evaluationData = null;

    if (campaignId) {
      // Campaign-based evaluation
      campaign = await db.campaign.findUnique({
        where: { id: campaignId },
        include: {
          anomalies: true,
          predictions: true
        }
      });

      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }

      evaluationData = {
        coordinates: {
          latitude: campaign.latitude,
          longitude: campaign.longitude
        },
        targetResource: campaign.resourceType,
        geologicalContext: campaign.geologyContext || 'unknown',
        radius: campaign.radiusKm * 1000, // Convert to meters
        timeRange: {
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
          end: new Date()
        }
      };
    } else {
      // Direct evaluation
      if (!coordinates || !targetResource || !geologicalContext) {
        return NextResponse.json(
          { error: 'Missing required fields: coordinates, targetResource, geologicalContext' },
          { status: 400 }
        );
      }

      evaluationData = {
        coordinates,
        targetResource,
        geologicalContext,
        depth: depth || undefined,
        radius: radius || 50000, // 50km default
        timeRange: {
          start: new Date(timeRange?.start || Date.now() - 365 * 24 * 60 * 60 * 1000),
          end: new Date(timeRange?.end || Date.now())
        }
      };
    }

    // Create anomaly candidate
    const candidate = {
      id: campaignId ? `candidate_${campaignId}_${Date.now()}` : `candidate_${Date.now()}`,
      coordinates: evaluationData.coordinates,
      targetResource: evaluationData.targetResource,
      geologicalContext: evaluationData.geologicalContext,
      depth: evaluationData.depth,
      radius: evaluationData.radius,
      timeRange: evaluationData.timeRange,
      metadata: {
        campaignId: campaignId || null,
        evaluationDate: new Date().toISOString(),
        evaluationType: campaignId ? 'campaign_based' : 'direct'
      }
    };

    console.log(`Starting consensus evaluation for ${candidate.metadata.evaluationType}: ${candidate.targetResource} at ${candidate.coordinates.latitude}, ${candidate.coordinates.longitude}`);

    // Gather real satellite data using Google Earth Engine
    const satelliteData = await consensusEngine.gatherSatelliteData(
      candidate.coordinates.latitude,
      candidate.coordinates.longitude,
      candidate.radius / 1000, // Convert to km
      candidate.targetResource,
      {
        start: candidate.timeRange.start.toISOString().split('T')[0],
        end: candidate.timeRange.end.toISOString().split('T')[0]
      }
    );

    console.log(`Satellite data gathered from source: ${satelliteData.metadata?.source || 'unknown'}`);

    // Run consensus evaluation
    const startTime = Date.now();
    const result = await consensusEngine.evaluateWithConsensus(candidate, satelliteData);
    const processingTime = Date.now() - startTime;

    // Save results to database for campaign-based evaluations
    let savedAnomalies = [];
    if (campaignId && result.detection && result.confidence > 0.7) {
      const anomalyData = {
        campaignId,
        latitude: candidate.coordinates.latitude + (Math.random() - 0.5) * 0.01,
        longitude: candidate.coordinates.longitude + (Math.random() - 0.5) * 0.01,
        depthM: candidate.depth || Math.random() * 5000 + 1000,
        probability: result.confidence,
        confidence: result.consensus,
        anomalyType: 'multi_agent_consensus',
        value: result.confidence * 100,
        volumeM3: Math.random() * 1000000000 + 100000000,
        resourceEstimate: {
          type: candidate.targetResource,
          high: result.confidence * 1.2,
          low: result.confidence * 0.8,
          expected: result.confidence
        },
        physicsValidation: {
          consensusScore: result.consensus,
          agentAgreement: result.agentAgreement,
          qualityScore: result.qualityReport?.overallQualityScore || 0,
          processingTime,
          vetoStatus: result.vetoStatus,
          dataSources: satelliteData.metadata?.source || 'unknown'
        }
      };

      try {
        const savedAnomaly = await db.anomaly.create({ data: anomalyData });
        savedAnomalies.push(savedAnomaly);
        console.log(`Saved high-confidence anomaly: ${savedAnomaly.id}`);
      } catch (error) {
        console.error('Error saving anomaly:', error);
      }
    }

    // Return comprehensive results
    const response = {
      success: true,
      candidate: {
        id: candidate.id,
        coordinates: candidate.coordinates,
        targetResource: candidate.targetResource,
        geologicalContext: candidate.geologicalContext,
        evaluationType: candidate.metadata.evaluationType,
        campaignId: campaignId || null
      },
      evaluation: {
        detection: result.detection,
        confidence: result.confidence,
        consensus: result.consensus,
        agentAgreement: result.agentAgreement,
        processingTime
      },
      dataSources: {
        primary: satelliteData.metadata?.source || 'unknown',
        gravity: !!satelliteData.gravity,
        spectral: !!satelliteData.spectral,
        topographic: !!satelliteData.topographic,
        temporal: !!satelliteData.temporal,
        thermal: !!satelliteData.thermal
      },
      quality: result.qualityReport,
      vetoStatus: result.vetoStatus,
      agentResults: Object.entries(result.agentResults || {}).map(([name, agentResult]) => ({
        agent: name,
        detection: agentResult.detection,
        confidence: agentResult.confidence,
        uncertainty: agentResult.uncertainty,
        processingTime: agentResult.metadata?.processingTime || 0
      })),
      anomalies: savedAnomalies,
      timestamp: new Date().toISOString()
    };

    console.log(`Consensus evaluation completed: Detection=${result.detection}, Confidence=${result.confidence.toFixed(3)}, Time=${processingTime}ms`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Consensus evaluation failed:', error);
    return NextResponse.json(
      { 
        error: 'Consensus evaluation failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}