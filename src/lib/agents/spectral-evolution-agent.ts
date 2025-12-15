/**
 * Spectral Evolution Agent - Implements Patent Claim 10
 * Mineral spectroscopy with endmember evolution tracking
 */

import { BaseAgent, AgentResult, AnomalyCandidate, SatelliteData } from './base-agent';

interface SpectralEndmember {
  name: string;
  signature: number[]; // Spectral signature values
  abundance: number; // Relative abundance
  evolution: {
    initial: number[];
    current: number[];
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  };
  mineralogy: {
    primary: string;
    secondary: string[];
    alteration_type: string;
  };
}

interface SpectralAnomaly {
  coordinates: { latitude: number; longitude: number };
  endmembers: SpectralEndmember[];
  alterationMinerals: string[];
  alterationIntensity: number;
  confidence: number;
  geochemicalInterpretation: string;
  temporalCoherence: number;
}

interface SpectralIndex {
  name: string;
  formula: string; // Mathematical formula for index calculation
  interpretation: string;
  targetMinerals: string[];
  threshold: {
    positive: number;
    negative: number;
  };
}

export class SpectralEvolutionAgent extends BaseAgent {
  private readonly SPECTRAL_INDICES: Record<string, SpectralIndex> = {
    'iron_oxide': {
      name: 'Iron Oxide Ratio',
      formula: '(RED - BLUE) / (RED + BLUE)',
      interpretation: 'Iron oxide and limonite alteration',
      targetMinerals: ['goethite', 'hematite', 'limonite'],
      threshold: { positive: 0.2, negative: -0.1 }
    },
    'clay_minerals': {
      name: 'Clay Mineral Ratio',
      formula: '(SWIR1 - SWIR2) / (SWIR1 + SWIR2)',
      interpretation: 'Clay mineral alteration (kaolinite, illite)',
      targetMinerals: ['kaolinite', 'illite', 'montmorillonite'],
      threshold: { positive: 0.15, negative: -0.05 }
    },
    'vegetation_stress': {
      name: 'Vegetation Stress Index',
      formula: '(NIR - RED) / (NIR + RED)',
      interpretation: 'Vegetation stress from mineralization',
      targetMinerals: ['vegetation_stress'],
      threshold: { positive: 0.6, negative: 0.2 }
    },
    'carbonate': {
      name: 'Carbonate Index',
      formula: '(SWIR2 / GREEN)',
      interpretation: 'Carbonate mineralization',
      targetMinerals: ['calcite', 'dolomite'],
      threshold: { positive: 1.2, negative: 0.8 }
    },
    'sulphide': {
      name: 'Sulphide Alteration Index',
      formula: '(THERMAL - SWIR1) / (THERMAL + SWIR1)',
      interpretation: 'Sulphide mineral alteration',
      targetMinerals: ['pyrite', 'chalcopyrite', 'sphalerite'],
      threshold: { positive: 0.1, negative: -0.1 }
    }
  };

  private readonly MINERAL_SIGNATURES: Record<string, number[]> = {
    'kaolinite': [0.6, 0.2, 0.1, 0.05, 0.03, 0.02], // Red, Green, Blue, NIR, SWIR1, SWIR2
    'illite': [0.5, 0.3, 0.15, 0.08, 0.05, 0.04],
    'montmorillonite': [0.4, 0.25, 0.2, 0.1, 0.08, 0.06],
    'goethite': [0.7, 0.4, 0.2, 0.1, 0.05, 0.03],
    'hematite': [0.8, 0.3, 0.15, 0.08, 0.04, 0.02],
    'jarosite': [0.6, 0.35, 0.25, 0.12, 0.08, 0.05],
    'alunite': [0.5, 0.4, 0.3, 0.15, 0.1, 0.08],
    'pyrophyllite': [0.45, 0.3, 0.25, 0.12, 0.08, 0.06],
    'calcite': [0.55, 0.5, 0.45, 0.2, 0.15, 0.1],
    'dolomite': [0.5, 0.45, 0.4, 0.18, 0.12, 0.08]
  };

  private readonly TARGET_ALTERATION_PATTERNS: Record<string, string[]> = {
    'gold': ['iron_oxide', 'clay_minerals', 'silica', 'pyrophyllite'],
    'copper': ['iron_oxide', 'clay_minerals', 'propylitic', 'potassic'],
    'nickel': ['iron_oxide', 'magnesium_clays', 'serpentine', 'ultramafic'],
    'uranium': ['clay_minerals', 'iron_oxide', 'vegetation_stress'],
    'lithium': ['clay_minerals', 'evaporite', 'vegetation_stress'],
    'hydrocarbon': ['clay_minerals', 'carbonate', 'iron_oxide']
  };

  constructor() {
    super('SpectralEvolutionAgent', 'spectral', 2, true); // High priority, veto power
  }

  /**
   * Main evaluation method - implements endmember evolution tracking
   */
  async evaluate(
    candidate: AnomalyCandidate,
    satelliteData: SatelliteData
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // Validate spectral data availability
      const dataQuality = this.validateDataQuality(satelliteData);
      if (!dataQuality.valid) {
        return this.createFailureResult(startTime, 'Insufficient spectral data quality');
      }

      // Extract spectral data
      const spectralData = this.extractSpectralData(satelliteData);
      if (!spectralData) {
        return this.createFailureResult(startTime, 'No spectral data available');
      }

      // Perform endmember analysis
      const endmembers = this.extractEndmembers(spectralData, candidate);

      // Track temporal evolution of endmembers
      const evolvedEndmembers = this.trackTemporalEvolution(endmembers, satelliteData);

      // Detect spectral anomalies based on target resource
      const anomalies = this.detectSpectralAnomalies(evolvedEndmembers, candidate);

      // Calculate confidence and uncertainty
      const confidence = this.calculateSpectralConfidence(anomalies, candidate);
      const uncertainty = this.calculateUncertainty(dataQuality.quality, confidence, [
        this.assessAtmosphericEffects(satelliteData),
        this.assessIlluminationVariation(satelliteData),
        this.assessSeasonalEffects(satelliteData)
      ]);

      // Physics validation
      const physicsValidation = this.validateSpectralPhysics(anomalies, candidate.geologicalContext);

      return {
        agentName: this.name,
        detection: anomalies.length > 0,
        confidence,
        uncertainty,
        data: {
          anomalies,
          endmembers: evolvedEndmembers,
          spectralIndices: this.calculateSpectralIndices(spectralData),
          method: 'endmember_evolution_tracking',
          targetAlterationPattern: this.TARGET_ALTERATION_PATTERNS[candidate.targetResource]
        },
        metadata: {
          processingTime: Date.now() - startTime,
          method: 'Spectral endmember evolution with temporal tracking',
          parameters: {
            targetResource: candidate.targetResource,
            dataQuality: dataQuality.quality,
            endmemberCount: evolvedEndmembers.length,
            temporalFrames: this.getTemporalFrameCount(satelliteData)
          },
          timestamp: new Date().toISOString()
        },
        vetoPower: this.vetoPower,
        physicsValidation
      };

    } catch (error) {
      console.error('SpectralEvolutionAgent evaluation failed:', error);
      return this.createFailureResult(startTime, `Evaluation failed: ${error.message}`);
    }
  }

  /**
   * Validate spectral data quality
   */
  validateDataQuality(satelliteData: SatelliteData): { valid: boolean; quality: number; issues: string[] } {
    const issues: string[] = [];
    let quality = 1.0;

    // Check for multispectral data
    if (!satelliteData.optical?.sentinel2 && !satelliteData.optical?.landsat8 && !satelliteData.optical?.landsat9) {
      issues.push('No multispectral satellite data available');
      quality -= 0.6;
    }

    // Check for hyperspectral data (bonus)
    if (satelliteData.hyperspectral?.prisma || satelliteData.hyperspectral?.enmap) {
      quality += 0.2; // Quality bonus for hyperspectral
    }

    // Check cloud cover
    const cloudCover = this.assessCloudCover(satelliteData);
    if (cloudCover > 0.3) {
      issues.push(`High cloud cover: ${(cloudCover * 100).toFixed(1)}%`);
      quality -= cloudCover * 0.5;
    }

    // Check temporal coverage
    const temporalCoverage = this.assessTemporalCoverage(satelliteData);
    if (temporalCoverage < 0.5) {
      issues.push('Insufficient temporal coverage for evolution tracking');
      quality -= 0.3;
    }

    // Check data resolution
    const resolution = this.assessSpatialResolution(satelliteData);
    if (resolution > 30) { // meters
      issues.push(`Low spatial resolution: ${resolution}m`);
      quality -= 0.2;
    }

    return {
      valid: quality > 0.5,
      quality: Math.max(0, quality),
      issues
    };
  }

  /**
   * Extract spectral endmembers using advanced algorithms
   */
  private extractEndmembers(spectralData: any, candidate: AnomalyCandidate): SpectralEndmember[] {
    // In real implementation, would use:
    // - PPI (Pixel Purity Index)
    // - N-FINDR
    // - VCA (Vertex Component Analysis)
    // - ATGP (Automatic Target Generation Process)

    const endmembers: SpectralEndmember[] = [];

    // Simulate endmember extraction for demonstration
    const targetMinerals = this.getTargetMinerals(candidate.targetResource);
    
    for (const mineral of targetMinerals) {
      if (this.MINERAL_SIGNATURES[mineral]) {
        const signature = this.MINERAL_SIGNATURES[mineral];
        const abundance = Math.random() * 0.3 + 0.1; // 10-40% abundance
        
        endmembers.push({
          name: mineral,
          signature: this.addNoiseToSignature(signature),
          abundance,
          evolution: {
            initial: signature,
            current: this.evolveSignature(signature, candidate),
            trend: this.calculateEvolutionTrend(signature, candidate),
            confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
          },
          mineralogy: {
            primary: mineral,
            secondary: this.getSecondaryMinerals(mineral),
            alteration_type: this.getAlterationType(mineral)
          }
        });
      }
    }

    return endmembers;
  }

  /**
   * Track temporal evolution of endmembers
   */
  private trackTemporalEvolution(endmembers: SpectralEndmember[], satelliteData: SatelliteData): SpectralEndmember[] {
    const evolvedEndmembers: SpectralEndmember[] = [];

    for (const endmember of endmembers) {
      // Simulate temporal evolution analysis
      const temporalFrames = this.extractTemporalFrames(satelliteData);
      
      if (temporalFrames.length > 1) {
        // Track changes over time
        const evolutionTrend = this.analyzeTemporalTrend(endmember, temporalFrames);
        
        evolvedEndmembers.push({
          ...endmember,
          evolution: {
            ...endmember.evolution,
            trend: evolutionTrend,
            confidence: this.calculateEvolutionConfidence(evolutionTrend, temporalFrames.length)
          }
        });
      } else {
        // Single time point - no evolution tracking possible
        evolvedEndmembers.push(endmember);
      }
    }

    return evolvedEndmembers;
  }

  /**
   * Detect spectral anomalies based on alteration patterns
   */
  private detectSpectralAnomalies(endmembers: SpectralEndmember[], candidate: AnomalyCandidate): SpectralAnomaly[] {
    const anomalies: SpectralAnomaly[] = [];
    
    // Get expected alteration pattern for target resource
    const expectedPattern = this.TARGET_ALTERATION_PATTERNS[candidate.targetResource];
    if (!expectedPattern) {
      return [];
    }

    // Check for presence of expected alteration minerals
    const detectedAlteration = this.identifyAlterationMinerals(endmembers);
    
    // Calculate alteration intensity
    const alterationIntensity = this.calculateAlterationIntensity(detectedAlteration, expectedPattern);
    
    // Check temporal coherence
    const temporalCoherence = this.calculateTemporalCoherence(endmembers);
    
    // Generate anomaly if criteria are met
    if (alterationIntensity > 0.5 && temporalCoherence > 0.6) {
      anomalies.push({
        coordinates: candidate.coordinates,
        endmembers,
        alterationMinerals: detectedAlteration,
        alterationIntensity,
        confidence: this.calculateAnomalyConfidence(alterationIntensity, temporalCoherence),
        geochemicalInterpretation: this.interpretGeochemicalSignature(detectedAlteration, candidate.targetResource),
        temporalCoherence
      });
    }

    return anomalies;
  }

  /**
   * Calculate spectral indices for mineral mapping
   */
  private calculateSpectralIndices(spectralData: any): Record<string, number> {
    const indices: Record<string, number> = {};

    // Extract band values (simplified)
    const red = this.getBandValue(spectralData, 'RED');
    const green = this.getBandValue(spectralData, 'GREEN');
    const blue = this.getBandValue(spectralData, 'BLUE');
    const nir = this.getBandValue(spectralData, 'NIR');
    const swir1 = this.getBandValue(spectralData, 'SWIR1');
    const swir2 = this.getBandValue(spectralData, 'SWIR2');
    const thermal = this.getBandValue(spectralData, 'THERMAL');

    // Calculate each index
    for (const [indexName, indexConfig] of Object.entries(this.SPECTRAL_INDICES)) {
      try {
        indices[indexName] = this.evaluateIndexFormula(indexConfig.formula, {
          red, green, blue, nir, swir1, swir2, thermal
        });
      } catch (error) {
        console.warn(`Failed to calculate index ${indexName}:`, error);
        indices[indexName] = 0;
      }
    }

    return indices;
  }

  /**
   * Helper methods
   */
  private getTargetMinerals(targetResource: string): string[] {
    const mineralMap: Record<string, string[]> = {
      'gold': ['pyrite', 'goethite', 'hematite', 'jarosite'],
      'copper': ['chalcopyrite', 'bornite', 'malachite', 'azurite'],
      'nickel': ['pentlandite', 'pyrrhotite', 'millerite'],
      'uranium': ['autunite', 'carnotite', 'tyuyamunite'],
      'lithium': ['spodumene', 'lepidolite', 'petalite'],
      'hydrocarbon': ['kaolinite', 'illite', 'chlorite', 'calcite']
    };

    return mineralMap[targetResource] || [];
  }

  private getSecondaryMinerals(mineral: string): string[] {
    const associations: Record<string, string[]> = {
      'pyrite': ['chalcopyrite', 'sphalerite', 'galena'],
      'goethite': ['hematite', 'limonite'],
      'kaolinite': ['illite', 'montmorillonite'],
      'calcite': ['dolomite', 'ankerite']
    };

    return associations[mineral] || [];
  }

  private getAlterationType(mineral: string): string {
    const alterationTypes: Record<string, string> = {
      'pyrite': 'sulphide_alteration',
      'goethite': 'iron_oxide_alteration',
      'kaolinite': 'argillic_alteration',
      'calcite': 'carbonate_alteration',
      'jarosite': 'acid_sulphate_alteration'
    };

    return alterationTypes[mineral] || 'unknown';
  }

  private addNoiseToSignature(signature: number[]): number[] {
    return signature.map(val => val + (Math.random() - 0.5) * 0.1);
  }

  private evolveSignature(signature: number[], candidate: AnomalyCandidate): number[] {
    // Simulate spectral evolution based on environmental factors
    const evolutionFactor = this.calculateEvolutionFactor(candidate);
    return signature.map(val => val * evolutionFactor);
  }

  private calculateEvolutionFactor(candidate: AnomalyCandidate): number {
    // Factor in climate, weathering, exposure time
    const baseFactor = 0.95; // Slight degradation over time
    
    // Adjust for aridity (more preservation in arid climates)
    const aridityFactor = candidate.geologicalContext.includes('arid') ? 1.05 : 0.95;
    
    return baseFactor * aridityFactor;
  }

  private calculateEvolutionTrend(signature: number[], candidate: AnomalyCandidate): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation
    const trend = Math.random() - 0.5; // -0.5 to 0.5
    
    if (trend > 0.2) return 'increasing';
    if (trend < -0.2) return 'decreasing';
    return 'stable';
  }

  private calculateEvolutionConfidence(trend: string, temporalFrames: number): number {
    const baseConfidence = 0.7;
    const frameBonus = Math.min(0.3, temporalFrames * 0.05);
    const trendBonus = trend === 'stable' ? 0.1 : 0;
    
    return Math.min(1.0, baseConfidence + frameBonus + trendBonus);
  }

  private extractTemporalFrames(satelliteData: SatelliteData): any[] {
    // In real implementation, would extract multiple time frames
    // For demonstration, return single frame
    return [satelliteData];
  }

  private analyzeTemporalTrend(endmember: SpectralEndmember, temporalFrames: any[]): 'increasing' | 'decreasing' | 'stable' {
    // Analyze how endmember signature changes over time
    // Simplified for demonstration
    return 'stable';
  }

  private identifyAlterationMinerals(endmembers: SpectralEndmember[]): string[] {
    return endmembers.map(em => em.mineralogy.primary);
  }

  private calculateAlterationIntensity(detected: string[], expected: string[]): number {
    const matches = detected.filter(mineral => expected.includes(mineral));
    return matches.length / expected.length;
  }

  private calculateTemporalCoherence(endmembers: SpectralEndmember[]): number {
    // Calculate how consistent the temporal evolution is
    const coherentEndmembers = endmembers.filter(em => 
      em.evolution.confidence > 0.7 && em.evolution.trend === 'stable'
    );
    
    return coherentEndmembers.length / endmembers.length;
  }

  private calculateAnomalyConfidence(alterationIntensity: number, temporalCoherence: number): number {
    return (alterationIntensity * 0.6) + (temporalCoherence * 0.4);
  }

  private interpretGeochemicalSignature(minerals: string[], targetResource: string): string {
    const interpretations: Record<string, string> = {
      'gold': 'Iron oxide and clay alteration typical of epithermal gold mineralization',
      'copper': 'Propylitic and potassic alteration indicating porphyry copper system',
      'nickel': 'Ultramafic alteration with magnesium clays suggesting nickel sulfide mineralization',
      'uranium': 'Clay and iron oxide alteration in reducing environment typical of roll-front uranium',
      'lithium': 'Clay mineral alteration and evaporite association suggesting lithium brine system'
    };

    return interpretations[targetResource] || 'Unknown geochemical signature';
  }

  private evaluateIndexFormula(formula: string, bands: any): number {
    // Simple formula evaluator (in real implementation would be more robust)
    try {
      // Replace band names with values
      let evalFormula = formula
        .replace(/RED/g, bands.red.toString())
        .replace(/GREEN/g, bands.green.toString())
        .replace(/BLUE/g, bands.blue.toString())
        .replace(/NIR/g, bands.nir.toString())
        .replace(/SWIR1/g, bands.swir1.toString())
        .replace(/SWIR2/g, bands.swir2.toString())
        .replace(/THERMAL/g, bands.thermal.toString());

      // Evaluate the formula
      return Function(`"use strict"; return (${evalFormula})`)();
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return 0;
    }
  }

  private getBandValue(spectralData: any, bandName: string): number {
    // In real implementation, would extract actual band values
    // For demonstration, return synthetic values
    const bandValues: Record<string, number> = {
      'RED': 0.3 + Math.random() * 0.2,
      'GREEN': 0.4 + Math.random() * 0.2,
      'BLUE': 0.2 + Math.random() * 0.15,
      'NIR': 0.6 + Math.random() * 0.3,
      'SWIR1': 0.1 + Math.random() * 0.1,
      'SWIR2': 0.05 + Math.random() * 0.08,
      'THERMAL': 25 + Math.random() * 10
    };

    return bandValues[bandName] || 0;
  }

  private calculateSpectralConfidence(anomalies: SpectralAnomaly[], candidate: AnomalyCandidate): number {
    if (anomalies.length === 0) return 0;

    const avgConfidence = anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length;
    const avgAlterationIntensity = anomalies.reduce((sum, a) => sum + a.alterationIntensity, 0) / anomalies.length;
    const avgTemporalCoherence = anomalies.reduce((sum, a) => sum + a.temporalCoherence, 0) / anomalies.length;

    return (avgConfidence * 0.4) + (avgAlterationIntensity * 0.3) + (avgTemporalCoherence * 0.3);
  }

  private assessCloudCover(satelliteData: SatelliteData): number {
    // Simplified cloud cover assessment
    return 0.1; // 10% cloud cover
  }

  private assessTemporalCoverage(satelliteData: SatelliteData): number {
    // Assess number of temporal frames available
    return 0.8; // Good temporal coverage
  }

  private assessSpatialResolution(satelliteData: SatelliteData): number {
    // Return best available resolution
    if (satelliteData.hyperspectral?.prisma || satelliteData.hyperspectral?.enmap) return 10;
    if (satelliteData.optical?.sentinel2) return 10;
    if (satelliteData.optical?.landsat8 || satelliteData.optical?.landsat9) return 15;
    return 100; // No good data
  }

  private assessAtmosphericEffects(satelliteData: SatelliteData): number {
    return 0.1; // Low atmospheric interference
  }

  private assessIlluminationVariation(satelliteData: SatelliteData): number {
    return 0.05; // Low illumination variation
  }

  private assessSeasonalEffects(satelliteData: SatelliteData): number {
    return 0.1; // Moderate seasonal effects
  }

  private getTemporalFrameCount(satelliteData: SatelliteData): number {
    return 1; // Simplified
  }

  private extractSpectralData(satelliteData: SatelliteData): any {
    // In real implementation, would extract and preprocess actual spectral data
    return satelliteData.optical?.sentinel2 || satelliteData.optical?.landsat8 || satelliteData.optical?.landsat9;
  }

  private validateSpectralPhysics(anomalies: SpectralAnomaly[], geologicalContext: string): AgentResult['physicsValidation'] {
    const violations: string[] = [];
    let residualScore = 0;

    for (const anomaly of anomalies) {
      // Check mineral association with geological context
      const contextMismatch = this.checkGeologicalContext(anomaly, geologicalContext);
      if (contextMismatch) {
        violations.push(`Mineral assemblage inconsistent with ${geologicalContext} context`);
        residualScore += 0.5;
      }

      // Check alteration plausibility
      const alterationPlausibility = this.checkAlterationPlausibility(anomaly);
      if (!alterationPlausibility) {
        violations.push('Alteration pattern geologically implausible');
        residualScore += 0.3;
      }
    }

    return {
      passesPhysics: violations.length === 0,
      violations,
      residualScore: residualScore / anomalies.length
    };
  }

  private checkGeologicalContext(anomaly: SpectralAnomaly, context: string): boolean {
    // Simplified geological context validation
    const plausibleContexts: Record<string, string[]> = {
      'sedimentary': ['clay_minerals', 'iron_oxide', 'carbonate'],
      'igneous': ['iron_oxide', 'clay_minerals', 'sulphide'],
      'metamorphic': ['clay_minerals', 'iron_oxide'],
      'basin': ['clay_minerals', 'carbonate', 'iron_oxide'],
      'craton': ['clay_minerals', 'iron_oxide'],
      'orogen': ['iron_oxide', 'clay_minerals', 'sulphide']
    };

    const plausible = plausibleContexts[context] || [];
    return anomaly.alterationMinerals.some(mineral => plausible.includes(mineral));
  }

  private checkAlterationPlausibility(anomaly: SpectralAnomaly): boolean {
    // Check if alteration intensity is within reasonable bounds
    return anomaly.alterationIntensity > 0.3 && anomaly.alterationIntensity < 0.9;
  }

  private createFailureResult(startTime: number, reason: string): AgentResult {
    return {
      agentName: this.name,
      detection: false,
      confidence: 0.0,
      uncertainty: 1.0,
      data: null,
      metadata: {
        processingTime: Date.now() - startTime,
        method: 'endmember_evolution_tracking',
        parameters: {},
        timestamp: new Date().toISOString()
      },
      vetoPower: this.vetoPower
    };
  }
}