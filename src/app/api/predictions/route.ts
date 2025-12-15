import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from 'z-ai-web-dev-sdk';

// GET /api/predictions - Get predictions for a campaign
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

    const predictions = await db.prediction.findMany({
      where: { campaignId },
      orderBy: { targetYear: 'asc' }
    });

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

// POST /api/predictions - Generate AI-powered predictions for a campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, timeHorizon = 5 } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Get campaign and anomaly data
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        anomalies: true
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Initialize ZAI SDK for predictive modeling
    const zai = await ZAI.create();

    // Prepare data for AI analysis
    const anomalyData = campaign.anomalies.map(anomaly => ({
      type: anomaly.anomalyType,
      confidence: anomaly.confidence,
      depth: anomaly.depthM,
      volume: anomaly.volumeM3,
      value: anomaly.value
    }));

    const currentYear = new Date().getFullYear();
    const generatedPredictions = [];

    // Generate predictions for each year in the time horizon
    for (let yearOffset = 1; yearOffset <= timeHorizon; yearOffset++) {
      const targetYear = currentYear + yearOffset;

      try {
        // Use AI to generate predictions based on anomaly data
        const aiPrompt = `
        Analyze the following subsurface anomaly data for a ${campaign.resourceType} exploration campaign and generate resource development predictions for year ${targetYear}.

        Campaign Details:
        - Location: ${campaign.latitude}°, ${campaign.longitude}°
        - Resource Type: ${campaign.resourceType}
        - Geology Context: ${campaign.geologyContext}
        - Search Radius: ${campaign.radiusKm} km

        Anomaly Data:
        ${JSON.stringify(anomalyData, null, 2)}

        Generate predictions for:
        1. Total estimated volume (m³)
        2. Estimated tonnage (if applicable)
        3. Confidence score (0-1)
        4. Uncertainty range (+/- percentage)

        Consider geological constraints, development timelines, and resource extraction economics.
        Respond with JSON format only.
        `;

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an expert geoscientist and resource analyst specializing in predictive subsurface intelligence. Provide realistic, physics-based predictions.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent predictions
          max_tokens: 500
        });

        const aiResponse = completion.choices[0]?.message?.content;
        let aiPredictions;

        try {
          aiPredictions = JSON.parse(aiResponse);
        } catch (parseError) {
          // Fallback to simple statistical model if AI fails
          console.warn('AI parsing failed, using fallback model');
          const totalVolume = campaign.anomalies.reduce((sum, a) => sum + (a.volumeM3 || 0), 0);
          const avgConfidence = campaign.anomalies.reduce((sum, a) => sum + a.confidence, 0) / campaign.anomalies.length;
          
          aiPredictions = {
            volume: totalVolume * (1 + yearOffset * 0.1), // 10% growth per year
            tonnage: campaign.resourceType === 'oil' || campaign.resourceType === 'minerals' ? 
                     totalVolume * 0.8 * (1 + yearOffset * 0.08) : null,
            confidence: Math.max(0.3, avgConfidence - yearOffset * 0.05), // Decreasing confidence over time
            uncertainty: yearOffset * 0.1 // Increasing uncertainty over time
          };
        }

        // Generate predictions for different scenarios
        const scenarios = ['base', 'optimistic', 'pessimistic'];
        
        for (const scenario of scenarios) {
          const scenarioMultiplier = scenario === 'optimistic' ? 1.2 : scenario === 'pessimistic' ? 0.8 : 1.0;
          
          const prediction = await db.prediction.create({
            data: {
              campaignId,
              targetYear,
              resourceType: campaign.resourceType,
              volumeM3: aiPredictions.volume * scenarioMultiplier,
              tonnage: aiPredictions.tonnage ? aiPredictions.tonnage * scenarioMultiplier : null,
              confidence: aiPredictions.confidence * scenarioMultiplier,
              uncertainty: aiPredictions.uncertainty,
              scenario,
              modelVersion: 'v4.0.0-zai'
            }
          });

          generatedPredictions.push(prediction);
        }

      } catch (aiError) {
        console.error(`AI prediction failed for year ${targetYear}:`, aiError);
        
        // Fallback to simple statistical model
        const totalVolume = campaign.anomalies.reduce((sum, a) => sum + (a.volumeM3 || 0), 0);
        const avgConfidence = campaign.anomalies.reduce((sum, a) => sum + a.confidence, 0) / campaign.anomalies.length;
        
        const fallbackPrediction = await db.prediction.create({
          data: {
            campaignId,
            targetYear,
            resourceType: campaign.resourceType,
            volumeM3: totalVolume * (1 + yearOffset * 0.1),
            tonnage: campaign.resourceType === 'oil' || campaign.resourceType === 'minerals' ? 
                     totalVolume * 0.8 * (1 + yearOffset * 0.08) : null,
            confidence: Math.max(0.3, avgConfidence - yearOffset * 0.05),
            uncertainty: yearOffset * 0.1,
            scenario: 'base',
            modelVersion: 'v4.0.0-fallback'
          }
        });

        generatedPredictions.push(fallbackPrediction);
      }
    }

    return NextResponse.json({ 
      message: `Generated predictions for ${timeHorizon} years`,
      predictions: generatedPredictions 
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}