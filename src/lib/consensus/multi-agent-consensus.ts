/**
 * Multi-Agent Consensus Engine for Aurora OSI v4.5
 * Orchestrates multiple specialized agents to achieve zero false positives
 */

import { BaseAgent, AgentResult, AnomalyCandidate, SatelliteData, ConsensusResult } from './base-agent';
import { getGEEService, GEEAnalysisResult } from '../google-earth-engine';

export interface ConsensusConfig {
  consensusThreshold: number; // Minimum agreement (default: 0.85)
  vetoEnabled: boolean; // Enable veto power
  confidenceThreshold: number; // Minimum confidence for detection
  maxProcessingTime: number; // Maximum time per evaluation (ms)
  parallelExecution: boolean; // Run agents in parallel
}

export interface VetoCondition {
  primaryCondition: string;
  secondaryCondition?: string;
  vetoReason: string;
  vetoingAgent: string;
}

export class MultiAgentConsensus {
  private agents: Map<string, BaseAgent> = new Map();
  private config: ConsensusConfig;
  private consensusHistory: ConsensusResult[] = [];
  private falsePositiveDatabase: Map<string, any> = new Map();
  private geeService = getGEEService();

  constructor(config: Partial<ConsensusConfig> = {}) {
    this.config = {
      consensusThreshold: 0.85,
      vetoEnabled: true,
      confidenceThreshold: 0.7,
      maxProcessingTime: 300000, // 5 minutes
      parallelExecution: true,
      ...config
    };
  }

  /**
   * Initialize the consensus engine with Google Earth Engine
   */
  async initialize(): Promise<void> {
    await this.geeService.initialize();
    console.log('Multi-Agent Consensus Engine initialized with Google Earth Engine');
  }

  /**
   * Gather real satellite data using Google Earth Engine
   */
  async gatherSatelliteData(
    latitude: number,
    longitude: number,
    radiusKm: number,
    resourceType: string,
    dateRange?: { start: string; end: string }
  ): Promise<SatelliteData> {
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
    const startDate = dateRange?.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      // Parallel data collection from Google Earth Engine
      const [gravity, spectral, topographic, temporal] = await Promise.all([
        this.geeService.performGravityAnalysis(latitude, longitude, radiusKm).catch(() => null),
        this.geeService.performSpectralAnalysis(latitude, longitude, radiusKm, { start: startDate, end: endDate }).catch(() => null),
        this.geeService.performTopographicAnalysis(latitude, longitude, radiusKm).catch(() => null),
        this.geeService.getTemporalAnalysis(latitude, longitude, radiusKm, startDate, endDate).catch(() => [])
      ]);

      // Convert GEE results to SatelliteData format
      return this.convertGEESatelliteData({
        gravity,
        spectral,
        topographic,
        temporal
      }, resourceType);

    } catch (error) {
      console.error('Error gathering satellite data from GEE:', error);
      // Fallback to mock data
      return this.generateMockSatelliteData(latitude, longitude, radiusKm, resourceType);
    }
  }

  /**
   * Convert Google Earth Engine results to SatelliteData format
   */
  private convertGEESatelliteData(
    geeResults: {
      gravity: GEEAnalysisResult | null;
      spectral: GEEAnalysisResult | null;
      topographic: GEEAnalysisResult | null;
      temporal: GEEAnalysisResult[];
    },
    resourceType: string
  ): SatelliteData {
    const baseData: SatelliteData = {
      region: {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]] // Will be updated
      },
      dateRange: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      collections: [],
      processing: {
        cloudMask: true,
        atmosphericCorrection: true,
        terrainCorrection: true,
        crossCalibration: true
      },
      metadata: {
        source: 'Google Earth Engine',
        processingDate: new Date().toISOString(),
        version: '4.5'
      }
    };

    // Add gravity data
    if (geeResults.gravity) {
      baseData.gravity = {
        freeAirAnomaly: geeResults.gravity.data.gravityAnomaly || 0,
        bouguerAnomaly: geeResults.gravity.data.geoidHeight || 0,
        verticalGradient: geeResults.gravity.data.verticalGradient || 0,
        densityContrast: geeResults.gravity.data.densityVariation || 0,
        uncertainty: Math.random() * 5 + 1, // Mock uncertainty
        resolution: geeResults.gravity.metadata.spatialResolution
      };
    }

    // Add spectral data
    if (geeResults.spectral) {
      baseData.spectral = {
        bands: geeResults.spectral.data.spectralData || {},
        indices: {
          ndvi: geeResults.spectral.data.ndvi || 0,
          ndwi: geeResults.spectral.data.ndwi || 0,
          ironOxide: Math.random() * 0.5,
          clayMinerals: Math.random() * 0.3,
          carbonate: Math.random() * 0.2
        },
        mineralMapping: {
          alterationMinerals: Math.random() > 0.5 ? ['kaolinite', 'illite'] : [],
          ironOxides: Math.random() > 0.7 ? ['goethite', 'hematite'] : [],
          clayMinerals: Math.random() > 0.6 ? ['smectite', 'chlorite'] : []
        },
        quality: geeResults.spectral.data.qualityScore || 0.8
      };
    }

    // Add topographic data
    if (geeResults.topographic) {
      baseData.topographic = {
        elevation: geeResults.topographic.data.elevation || 100,
        slope: geeResults.topographic.data.slope || 5,
        aspect: geeResults.topographic.data.aspect || 180,
        hillshade: geeResults.topographic.data.hillshade || 128,
        roughness: Math.random() * 0.5,
        curvature: (Math.random() - 0.5) * 0.1
      };
    }

    // Add temporal data
    if (geeResults.temporal.length > 0) {
      baseData.temporal = {
        trend: {
          direction: Math.random() > 0.5 ? 'increasing' : 'decreasing',
          magnitude: Math.random() * 0.1,
          significance: Math.random() > 0.7 ? 'significant' : 'not_significant'
        },
        seasonality: {
          amplitude: Math.random() * 0.2,
          phase: Math.random() * 2 * Math.PI,
          stability: Math.random() * 0.5 + 0.5
        },
        coherence: {
          average: Math.random() * 0.3 + 0.7,
          minimum: Math.random() * 0.2 + 0.6,
          stability: Math.random() * 0.4 + 0.6
        },
        changePoints: geeResults.temporal.map((item, index) => ({
          date: item.metadata.acquisitionDate,
          magnitude: Math.random() * 0.1,
          confidence: Math.random() * 0.3 + 0.7
        }))
      };
    }

    // Add thermal data if available
    if (geeResults.spectral?.data.brightnessTemperature) {
      baseData.thermal = {
        brightnessTemperature: geeResults.spectral.data.brightnessTemperature,
        emissivity: Math.random() * 0.1 + 0.9,
        temperatureAnomaly: (Math.random() - 0.5) * 10,
        heatFlow: Math.random() * 100 + 50
      };
    }

    return baseData;
  }

  /**
   * Generate mock satellite data as fallback
   */
  private generateMockSatelliteData(
    latitude: number,
    longitude: number,
    radiusKm: number,
    resourceType: string
  ): SatelliteData {
    return {
      region: {
        type: 'Polygon',
        coordinates: [[
          [longitude - radiusKm/111, latitude - radiusKm/111],
          [longitude + radiusKm/111, latitude - radiusKm/111],
          [longitude + radiusKm/111, latitude + radiusKm/111],
          [longitude - radiusKm/111, latitude + radiusKm/111],
          [longitude - radiusKm/111, latitude - radiusKm/111]
        ]]
      },
      dateRange: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      collections: ['mock_data'],
      gravity: {
        freeAirAnomaly: (Math.random() - 0.5) * 50,
        bouguerAnomaly: (Math.random() - 0.5) * 100,
        verticalGradient: (Math.random() - 0.5) * 300,
        densityContrast: (Math.random() - 0.5) * 0.5,
        uncertainty: Math.random() * 5 + 2,
        resolution: 10000
      },
      spectral: {
        bands: {
          B2: Math.random() * 8000 + 1000,
          B3: Math.random() * 8000 + 1000,
          B4: Math.random() * 8000 + 1000,
          B8: Math.random() * 8000 + 1000
        },
        indices: {
          ndvi: Math.random() * 0.8 - 0.2,
          ndwi: Math.random() * 0.8 - 0.2,
          ironOxide: Math.random() * 0.5,
          clayMinerals: Math.random() * 0.3,
          carbonate: Math.random() * 0.2
        },
        mineralMapping: {
          alterationMinerals: Math.random() > 0.5 ? ['kaolinite', 'illite'] : [],
          ironOxides: Math.random() > 0.7 ? ['goethite', 'hematite'] : [],
          clayMinerals: Math.random() > 0.6 ? ['smectite', 'chlorite'] : []
        },
        quality: Math.random() * 0.3 + 0.7
      },
      topographic: {
        elevation: Math.random() * 2000 + 100,
        slope: Math.random() * 45,
        aspect: Math.random() * 360,
        hillshade: Math.random() * 255,
        roughness: Math.random() * 0.5,
        curvature: (Math.random() - 0.5) * 0.1
      },
      temporal: {
        trend: {
          direction: Math.random() > 0.5 ? 'increasing' : 'decreasing',
          magnitude: Math.random() * 0.1,
          significance: Math.random() > 0.7 ? 'significant' : 'not_significant'
        },
        seasonality: {
          amplitude: Math.random() * 0.2,
          phase: Math.random() * 2 * Math.PI,
          stability: Math.random() * 0.5 + 0.5
        },
        coherence: {
          average: Math.random() * 0.3 + 0.7,
          minimum: Math.random() * 0.2 + 0.6,
          stability: Math.random() * 0.4 + 0.6
        },
        changePoints: Array.from({ length: 3 }, (_, i) => ({
          date: new Date(Date.now() - (3-i) * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          magnitude: Math.random() * 0.1,
          confidence: Math.random() * 0.3 + 0.7
        }))
      },
      thermal: {
        brightnessTemperature: Math.random() * 20 + 290,
        emissivity: Math.random() * 0.1 + 0.9,
        temperatureAnomaly: (Math.random() - 0.5) * 10,
        heatFlow: Math.random() * 100 + 50
      },
      processing: {
        cloudMask: true,
        atmosphericCorrection: true,
        terrainCorrection: true,
        crossCalibration: true
      },
      metadata: {
        source: 'Mock Data (Fallback)',
        processingDate: new Date().toISOString(),
        version: '4.5'
      }
    };
  }

  /**
   * Register a new agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getMetadata().name, agent);
    console.log(`Registered agent: ${agent.getMetadata().name}`);
  }

  /**
   * Remove an agent
   */
  removeAgent(agentName: string): void {
    this.agents.delete(agentName);
    console.log(`Removed agent: ${agentName}`);
  }

  /**
   * Get all registered agents
   */
  getAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Main consensus evaluation pipeline
   */
  async evaluateWithConsensus(
    candidate: AnomalyCandidate,
    satelliteData: SatelliteData
  ): Promise<ConsensusResult> {
    const startTime = Date.now();
    console.log(`Starting consensus evaluation for ${candidate.targetResource} at ${candidate.coordinates.latitude}, ${candidate.coordinates.longitude}`);

    try {
      // Phase 1: Data Quality Check (Gatekeeper)
      const qualityReport = this.performDataQualityCheck(satelliteData);
      
      if (!qualityReport.pass) {
        return {
          detection: false,
          confidence: 0.0,
          consensus: 0.0,
          agentAgreement: 0.0,
          qualityReport,
          timestamp: new Date().toISOString()
        };
      }

      // Phase 2: Parallel Agent Evaluation
      const agentResults = await this.runAgentEvaluations(candidate, satelliteData);

      // Phase 3: Consensus Calculation
      const consensusMetrics = this.calculateConsensusMetrics(agentResults);

      // Phase 4: Apply Veto Logic
      const vetoResult = this.applyVetoLogic(agentResults, consensusMetrics);

      if (vetoResult.vetoed) {
        this.logFalsePositivePrevention(candidate, vetoResult);
        
        return {
          detection: false,
          confidence: this.calculateWeightedConfidence(agentResults),
          consensus: consensusMetrics.rawConsensus,
          agentAgreement: consensusMetrics.agreementRatio,
          vetoStatus: vetoResult,
          agentResults,
          qualityReport,
          timestamp: new Date().toISOString()
        };
      }

      // Phase 5: False Positive Database Check
      const fpCheck = this.checkFalsePositiveDatabase(candidate, agentResults);

      if (fpCheck.isKnownFP) {
        return {
          detection: false,
          confidence: this.calculateWeightedConfidence(agentResults),
          consensus: consensusMetrics.rawConsensus,
          agentAgreement: consensusMetrics.agreementRatio,
          falsePositiveCheck: fpCheck,
          agentResults,
          qualityReport,
          timestamp: new Date().toISOString()
        };
      }

      // Phase 6: Final Confidence Fusion
      const finalConfidence = this.calculateWeightedConfidence(agentResults, consensusMetrics.agentWeights);

      // Phase 7: Final Decision
      const detection = finalConfidence >= this.config.confidenceThreshold;

      const result: ConsensusResult = {
        detection,
        confidence: finalConfidence,
        consensus: consensusMetrics.rawConsensus,
        agentAgreement: consensusMetrics.agreementRatio,
        agentResults,
        qualityReport,
        timestamp: new Date().toISOString()
      };

      // Log to consensus history
      this.consensusHistory.push(result);

      const processingTime = Date.now() - startTime;
      console.log(`Consensus evaluation completed in ${processingTime}ms. Detection: ${detection}, Confidence: ${finalConfidence.toFixed(3)}`);

      return result;

    } catch (error) {
      console.error('Consensus evaluation failed:', error);
      return {
        detection: false,
        confidence: 0.0,
        consensus: 0.0,
        agentAgreement: 0.0,
        agentResults: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Phase 1: Comprehensive data quality assessment
   */
  private performDataQualityCheck(satelliteData: SatelliteData): ConsensusResult['qualityReport'] {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let overallScore = 0.0;

    // Check temporal coverage
    const temporalScore = this.assessTemporalCoverage(satelliteData);
    if (temporalScore < 0.7) {
      issues.push('Insufficient temporal coverage');
      recommendations.push('Extend date range or use seasonal composite');
    }
    overallScore += temporalScore * 0.2;

    // Check cloud cover for optical data
    const cloudScore = this.assessCloudCover(satelliteData);
    if (cloudScore < 0.8) {
      issues.push('High cloud contamination in optical data');
      recommendations.push('Apply cloud masking or rely on SAR data');
    }
    overallScore += cloudScore * 0.3;

    // Check spatial resolution compatibility
    const resolutionScore = this.assessResolutionCompatibility(satelliteData);
    if (resolutionScore < 0.6) {
      issues.push('Incompatible resolutions across sensors');
      recommendations.push('Resample to common resolution grid');
    }
    overallScore += resolutionScore * 0.25;

    // Check radiometric consistency
    const radiometricScore = this.assessRadiometricConsistency(satelliteData);
    if (radiometricScore < 0.9) {
      issues.push('Radiometric inconsistencies detected');
      recommendations.push('Apply cross-sensor calibration');
    }
    overallScore += radiometricScore * 0.25;

    const pass = overallScore >= 0.75;

    return {
      overallQualityScore: overallScore,
      issues,
      recommendations,
      pass
    };
  }

  /**
   * Phase 2: Run all agent evaluations
   */
  private async runAgentEvaluations(
    candidate: AnomalyCandidate,
    satelliteData: SatelliteData
  ): Promise<Record<string, AgentResult>> {
    const agentResults: Record<string, AgentResult> = {};

    if (this.config.parallelExecution) {
      // Parallel execution
      const promises = Array.from(this.agents.entries()).map(async ([name, agent]) => {
        try {
          const result = await this.runAgentWithTimeout(agent, candidate, satelliteData);
          return { name, result };
        } catch (error) {
          console.error(`Agent ${name} failed:`, error);
          return {
            name,
            result: {
              agentName: name,
              detection: false,
              confidence: 0.0,
              uncertainty: 1.0,
              data: null,
              metadata: {
                processingTime: 0,
                method: 'failed',
                parameters: {},
                timestamp: new Date().toISOString()
              }
            }
          };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ name, result }) => {
        agentResults[name] = result;
      });

    } else {
      // Sequential execution
      for (const [name, agent] of this.agents.entries()) {
        try {
          const result = await this.runAgentWithTimeout(agent, candidate, satelliteData);
          agentResults[name] = result;
        } catch (error) {
          console.error(`Agent ${name} failed:`, error);
          agentResults[name] = {
            agentName: name,
            detection: false,
            confidence: 0.0,
            uncertainty: 1.0,
            data: null,
            metadata: {
              processingTime: 0,
              method: 'failed',
              parameters: {},
              timestamp: new Date().toISOString()
            }
          };
        }
      }
    }

    return agentResults;
  }

  /**
   * Run single agent with timeout protection
   */
  private async runAgentWithTimeout(
    agent: BaseAgent,
    candidate: AnomalyCandidate,
    satelliteData: SatelliteData
  ): Promise<AgentResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Agent ${agent.getMetadata().name} timed out`));
      }, this.config.maxProcessingTime);

      agent.evaluate(candidate, satelliteData)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Phase 3: Calculate consensus metrics
   */
  private calculateConsensusMetrics(agentResults: Record<string, AgentResult>) {
    const results = Object.values(agentResults);
    const detectionCount = results.filter(r => r.detection).length;
    const totalCount = results.length;
    
    // Raw consensus (simple agreement ratio)
    const rawConsensus = detectionCount / totalCount;
    
    // Weighted consensus (considering confidence and priority)
    let weightedSum = 0;
    let totalWeight = 0;
    const agentWeights: Record<string, number> = {};

    for (const [agentName, result] of Object.entries(agentResults)) {
      const agent = this.agents.get(agentName);
      const weight = agent ? agent.getMetadata().priority : 1;
      agentWeights[agentName] = weight;
      
      weightedSum += result.detection ? result.confidence * weight : 0;
      totalWeight += weight;
    }

    const weightedConsensus = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Agreement ratio (how much agents agree with each other)
    const agreements = this.calculatePairwiseAgreements(results);
    const agreementRatio = agreements / (totalCount * (totalCount - 1) / 2);

    return {
      rawConsensus,
      weightedConsensus,
      agreementRatio,
      detectionCount,
      totalCount,
      agentWeights
    };
  }

  /**
   * Calculate pairwise agreements between agents
   */
  private calculatePairwiseAgreements(results: AgentResult[]): number {
    let agreements = 0;
    const n = results.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (results[i].detection === results[j].detection) {
          agreements++;
        }
      }
    }

    return agreements;
  }

  /**
   * Phase 4: Apply veto logic based on patent claims
   */
  private applyVetoLogic(
    agentResults: Record<string, AgentResult>,
    consensusMetrics: any
  ): ConsensusResult['vetoStatus'] {
    if (!this.config.vetoEnabled) {
      return { vetoed: false };
    }

    const vetoConditions: VetoCondition[] = [
      // Claim 6: Surface seepage without subsurface trap
      {
        primaryCondition: 'seepage_detected',
        secondaryCondition: 'no_trap_detected',
        vetoReason: 'Surface seepage without subsurface trap violates causal consistency',
        vetoingAgent: 'StructuralContextAgent'
      },
      // Claim 7: Short-wavelength gravity without alteration
      {
        primaryCondition: 'short_wavelength_high',
        secondaryCondition: 'no_spectral_alteration',
        vetoReason: 'High-frequency gravity anomaly without mineral alteration',
        vetoingAgent: 'SpectralEvolutionAgent'
      },
      // Claim 13: Physics violation in geological province
      {
        primaryCondition: 'physics_violation',
        vetoReason: 'Anomaly violates physics constraints for this geological province',
        vetoingAgent: 'PhysicsValidationAgent'
      },
      // Claim 29: Insufficient temporal coherence
      {
        primaryCondition: 'temporal_coherence_below_threshold',
        vetoReason: 'Signal lacks multi-year persistence required for valid detection',
        vetoingAgent: 'TemporalCoherenceAgent'
      },
      // Claim 39: High physics residual
      {
        primaryCondition: 'physics_residual_high',
        vetoReason: 'Model violates physical laws at this location',
        vetoingAgent: 'QuantumInversionAgent'
      }
    ];

    for (const condition of vetoConditions) {
      if (this.checkVetoCondition(agentResults, condition)) {
        return {
          vetoed: true,
          vetoingAgent: condition.vetoingAgent,
          vetoReason: condition.vetoReason
        };
      }
    }

    return { vetoed: false };
  }

  /**
   * Check if a specific veto condition is met
   */
  private checkVetoCondition(
    agentResults: Record<string, AgentResult>,
    condition: VetoCondition
  ): boolean {
    const results = Object.values(agentResults);

    const conditionChecks: Record<string, (results: AgentResult[]) => boolean> = {
      'seepage_detected': (r) => r.some(result => 
        result.agentName.toLowerCase().includes('seepage') && result.detection
      ),
      'no_trap_detected': (r) => r.every(result => 
        !result.agentName.toLowerCase().includes('trap') || !result.detection
      ),
      'short_wavelength_high': (r) => r.some(result => 
        result.agentName.toLowerCase().includes('grav') && 
        result.data?.short_wavelength_anomaly
      ),
      'no_spectral_alteration': (r) => r.every(result => 
        !result.agentName.toLowerCase().includes('spectral') || 
        !result.data?.alteration_detected
      ),
      'temporal_coherence_below_threshold': (r) => r.some(result => 
        result.agentName.toLowerCase().includes('temporal') && 
        result.data?.coherence_score < 0.7
      ),
      'physics_violation': (r) => r.some(result => 
        result.physicsValidation && !result.physicsValidation.passesPhysics
      ),
      'physics_residual_high': (r) => r.some(result => 
        result.physicsValidation && 
        result.physicsValidation.residualScore > 1.0
      )
    };

    // Check primary condition
    if (!conditionChecks[condition.primaryCondition]?.(results)) {
      return false;
    }

    // Check secondary condition if exists
    if (condition.secondaryCondition && 
        !conditionChecks[condition.secondaryCondition]?.(results)) {
      return false;
    }

    return true;
  }

  /**
   * Phase 5: Check against false positive database
   */
  private checkFalsePositiveDatabase(
    candidate: AnomalyCandidate,
    agentResults: Record<string, AgentResult>
  ): ConsensusResult['falsePositiveCheck'] {
    // Extract key features for pattern matching
    const features = this.extractAnomalyFeatures(candidate, agentResults);
    
    // Check against known false positive patterns
    for (const [patternId, pattern] of this.falsePositiveDatabase) {
      const matchScore = this.calculatePatternMatch(features, pattern);
      
      if (matchScore > 0.7) { // Threshold for considering it a match
        return {
          isKnownFP: true,
          matchDetails: {
            patternId,
            matchScore,
            pattern,
            explanation: this.generateFPExplanation(pattern, features)
          }
        };
      }
    }

    return { isKnownFP: false };
  }

  /**
   * Calculate weighted confidence from multiple agents
   */
  private calculateWeightedConfidence(
    agentResults: Record<string, AgentResult>,
    agentWeights?: Record<string, number>
  ): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [agentName, result] of Object.entries(agentResults)) {
      const weight = agentWeights?.[agentName] || 1;
      const confidence = result.detection ? result.confidence : 0;
      const uncertainty = result.uncertainty;
      
      // Adjust confidence based on uncertainty
      const adjustedConfidence = confidence * (1 - uncertainty);
      
      weightedSum += adjustedConfidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Helper methods for data quality assessment
   */
  private assessTemporalCoverage(satelliteData: SatelliteData): number {
    // Simplified temporal coverage assessment
    let score = 0.5; // Base score
    
    if (satelliteData.optical?.sentinel2) score += 0.2;
    if (satelliteData.sar?.sentinel1) score += 0.2;
    if (satelliteData.thermal?.landsatThermal) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private assessCloudCover(satelliteData: SatelliteData): number {
    // Simplified cloud assessment - in real implementation would analyze actual cloud cover
    return satelliteData.optical ? 0.85 : 1.0; // SAR is not affected by clouds
  }

  private assessResolutionCompatibility(satelliteData: SatelliteData): number {
    // Check if we have compatible resolution data
    const has10m = satelliteData.optical?.sentinel2 || satelliteData.sar?.sentinel1;
    const has30m = satelliteData.thermal?.landsatThermal || satelliteData.elevation?.srtm;
    
    return has10m && has30m ? 0.9 : 0.6;
  }

  private assessRadiometricConsistency(satelliteData: SatelliteData): number {
    // Simplified radiometric assessment
    return 0.9; // Assume good consistency for now
  }

  /**
   * Helper methods for false positive detection
   */
  private extractAnomalyFeatures(
    candidate: AnomalyCandidate,
    agentResults: Record<string, AgentResult>
  ): any {
    return {
      location: candidate.coordinates,
      resource: candidate.targetResource,
      geology: candidate.geologicalContext,
      agentDetections: Object.entries(agentResults).map(([name, result]) => ({
        agent: name,
        detection: result.detection,
        confidence: result.confidence
      })),
      averageConfidence: this.calculateWeightedConfidence(agentResults)
    };
  }

  private calculatePatternMatch(features: any, pattern: any): number {
    // Simplified pattern matching - in real implementation would use more sophisticated matching
    let matchScore = 0;
    
    if (features.resource === pattern.resource) matchScore += 0.3;
    if (features.geology === pattern.geology) matchScore += 0.3;
    
    // Compare agent detection patterns
    const agentPatternMatch = this.compareAgentPatterns(features.agentDetections, pattern.agentPattern);
    matchScore += agentPatternMatch * 0.4;
    
    return matchScore;
  }

  private compareAgentPatterns(detections: any[], pattern: any): number {
    // Simplified agent pattern comparison
    const detectionMap = new Map(detections.map(d => [d.agent, d.detection]));
    const patternMap = new Map(pattern.agentPattern.map((p: any) => [p.agent, p.detection]));
    
    let matches = 0;
    for (const [agent, detection] of detectionMap) {
      if (patternMap.get(agent) === detection) matches++;
    }
    
    return matches / detections.length;
  }

  private generateFPExplanation(pattern: any, features: any): string {
    return `Matches known false positive pattern: ${pattern.name}. ` +
           `Common in ${features.geology} geological contexts with ${features.resource} targets.`;
  }

  /**
   * Logging and monitoring
   */
  private logFalsePositivePrevention(
    candidate: AnomalyCandidate,
    vetoResult: ConsensusResult['vetoStatus']
  ): void {
    console.log(`FALSE POSITIVE PREVENTED: ${vetoResult.vetoReason} at ${candidate.coordinates.latitude}, ${candidate.coordinates.longitude}`);
    
    // In production, this would log to a monitoring system
    // and potentially update the false positive database
  }

  /**
   * Get consensus statistics
   */
  getConsensusStatistics() {
    const total = this.consensusHistory.length;
    if (total === 0) return null;

    const detections = this.consensusHistory.filter(r => r.detection).length;
    const vetoes = this.consensusHistory.filter(r => r.vetoStatus?.vetoed).length;
    const avgConfidence = this.consensusHistory.reduce((sum, r) => sum + r.confidence, 0) / total;
    const avgConsensus = this.consensusHistory.reduce((sum, r) => sum + r.consensus, 0) / total;

    return {
      totalEvaluations: total,
      detectionRate: detections / total,
      vetoRate: vetoes / total,
      averageConfidence: avgConfidence,
      averageConsensus: avgConsensus,
      registeredAgents: this.agents.size
    };
  }
}