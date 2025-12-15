/**
 * Base Agent Interface for Aurora OSI v4.5 Multi-Agent System
 * All specialized agents must implement this interface
 */

export interface AgentResult {
  agentName: string;
  detection: boolean;
  confidence: number;
  uncertainty: number;
  data: any;
  metadata: {
    processingTime: number;
    method: string;
    parameters: Record<string, any>;
    timestamp: string;
  };
  vetoPower?: boolean; // Some agents have veto power
  physicsValidation?: {
    passesPhysics: boolean;
    violations: string[];
    residualScore: number;
  };
}

export interface AnomalyCandidate {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  targetResource: string;
  geologicalContext: string;
  depth?: number;
  radius?: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface SatelliteData {
  optical?: {
    sentinel2: any;
    landsat8: any;
    landsat9: any;
  };
  sar?: {
    sentinel1: any;
    alos: any;
  };
  thermal?: {
    landsatThermal: any;
    modisLST: any;
  };
  gravity?: {
    grace: any;
    goce: any;
  };
  hyperspectral?: {
    prisma: any;
    enmap: any;
  };
  elevation?: {
    srtm: any;
    aster: any;
  };
}

export interface ConsensusResult {
  detection: boolean;
  confidence: number;
  consensus: number;
  agentAgreement: number;
  vetoStatus?: {
    vetoed: boolean;
    vetoingAgent?: string;
    vetoReason?: string;
  };
  agentResults: Record<string, AgentResult>;
  falsePositiveCheck?: {
    isKnownFP: boolean;
    matchDetails?: any;
  };
  qualityReport?: {
    overallQualityScore: number;
    issues: string[];
    recommendations: string[];
    pass: boolean;
  };
  timestamp: string;
}

export abstract class BaseAgent {
  protected name: string;
  protected type: string;
  protected priority: number;
  protected vetoPower: boolean;

  constructor(name: string, type: string, priority: number = 1, vetoPower: boolean = false) {
    this.name = name;
    this.type = type;
    this.priority = priority;
    this.vetoPower = vetoPower;
  }

  /**
   * Main evaluation method - must be implemented by all agents
   */
  abstract async evaluate(
    candidate: AnomalyCandidate,
    satelliteData: SatelliteData
  ): Promise<AgentResult>;

  /**
   * Extract satellite data for agent evaluation
   */
  protected extractSatelliteData(satelliteData: SatelliteData): any {
    // Extract gravity data
    if (satelliteData.gravity?.grace || satelliteData.gravity?.goce) {
      return satelliteData.gravity;
    }
    
    // Extract optical data
    if (satelliteData.optical?.sentinel2 || satelliteData.optical?.landsat8 || satelliteData.optical?.landsat9) {
      return satelliteData.optical;
    }
    
    // Extract SAR data
    if (satelliteData.sar?.sentinel1) {
      return satelliteData.sar;
    }
    
    // Extract thermal data
    if (satelliteData.thermal?.landsat) {
      return satelliteData.thermal;
    }
    
    // Extract hyperspectral data
    if (satelliteData.hyperspectral?.prisma || satelliteData.hyperspectral?.enmap) {
      return satelliteData.hyperspectral;
    }
    
    // Extract elevation data
    if (satelliteData.elevation?.srtm) {
      return satelliteData.elevation;
    }
    
    return null;
  };

  /**
   * Get agent metadata
   */
  getMetadata() {
    return {
      name: this.name,
      type: this.type,
      priority: this.priority,
      vetoPower: this.vetoPower
    };
  }

  /**
   * Calculate uncertainty based on data quality and method limitations
   */
  protected calculateUncertainty(
    dataQuality: number,
    methodConfidence: number,
    environmentalFactors: number[]
  ): number {
    const baseUncertainty = 1 - (dataQuality * methodConfidence);
    const environmentalUncertainty = environmentalFactors.reduce((sum, factor) => sum + factor, 0) / environmentalFactors.length;
    return Math.min(0.95, baseUncertainty + environmentalUncertainty);
  }

  /**
   * Validate physics constraints
   */
  protected validatePhysics(
    result: any,
    geologicalContext: string
  ): AgentResult['physicsValidation'] {
    const violations: string[] = [];
    let residualScore = 0;

    // Density-depth relationship check
    if (result.density && result.depth) {
      const expectedDensity = this.calculateExpectedDensity(result.depth, geologicalContext);
      const densityError = Math.abs(result.density - expectedDensity);
      if (densityError > 0.3) { // g/cc threshold
        violations.push('Density-depth relationship violation');
        residualScore += densityError;
      }
    }

    // Temperature-depth check
    if (result.temperature && result.depth) {
      const expectedTemp = this.calculateExpectedTemperature(result.depth, geologicalContext);
      const tempError = Math.abs(result.temperature - expectedTemp);
      if (tempError > 5) { // °C threshold
        violations.push('Temperature-depth relationship violation');
        residualScore += tempError / 10;
      }
    }

    // Gravity-geology correlation
    if (result.gravityAnomaly && geologicalContext) {
      const expectedCorrelation = this.getExpectedGravityCorrelation(geologicalContext);
      const correlationError = Math.abs(result.gravityAnomaly - expectedCorrelation);
      if (correlationError > expectedCorrelation * 0.5) {
        violations.push('Gravity-geology correlation violation');
        residualScore += correlationError / expectedCorrelation;
      }
    }

    return {
      passesPhysics: violations.length === 0,
      violations,
      residualScore: residualScore / 3 // Normalize
    };
  }

  private calculateExpectedDensity(depth: number, geologicalContext: string): number {
    const baseDensities = {
      'sedimentary': 2.3,
      'igneous': 2.7,
      'metamorphic': 2.8,
      'basin': 2.4,
      'craton': 2.8,
      'orogen': 2.6,
      'shield': 2.9
    };

    const baseDensity = baseDensities[geologicalContext] || 2.6;
    // Density increases with depth (compaction)
    return baseDensity + (depth / 10000) * 0.2;
  }

  private calculateExpectedTemperature(depth: number, geologicalContext: string): number {
    // Geothermal gradient ~25-30°C/km
    const gradient = 28; // °C/km average
    const surfaceTemp = 15; // °C average
    return surfaceTemp + (depth / 1000) * gradient;
  }

  private getExpectedGravityCorrelation(geologicalContext: string): number {
    const correlations = {
      'basin': -30, // mGal
      'craton': -15,
      'orogen': -25,
      'shield': -10,
      'platform': -20
    };

    return correlations[geologicalContext] || -20;
  }

  /**
   * Calculate confidence based on multiple factors
   */
  protected calculateConfidence(
    signalStrength: number,
    noiseLevel: number,
    dataQuality: number,
    methodReliability: number
  ): number {
    const signalToNoise = signalStrength / (noiseLevel + 0.001);
    const baseConfidence = Math.tanh(signalToNoise / 2); // Saturates at 1.0
    return baseConfidence * dataQuality * methodReliability;
  }
}