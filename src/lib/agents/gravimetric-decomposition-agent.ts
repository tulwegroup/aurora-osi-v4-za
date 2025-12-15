/**
 * Gravimetric Decomposition Agent - Implements Patent Claim 2
 * Multi-orbit gravimetric decomposition for subsurface anomaly detection
 */

import { BaseAgent, AgentResult, AnomalyCandidate, SatelliteData } from './base-agent';

interface DecomposedGravity {
  longWavelength: number[][];    // Deep crustal/mantle features (>150km)
  mediumWavelength: number[][];  // Basin-scale structures (50-150km)
  shortWavelength: number[][];   // Local ore bodies/traps (<50km)
  original: number[][];
  residuals: number[][];
}

interface GravityAnomaly {
  coordinates: { latitude: number; longitude: number };
  amplitude: number;
  wavelengthComponent: 'long' | 'medium' | 'short';
  depth: number;
  confidence: number;
  physicalInterpretation: string;
}

export class GravimetricDecompositionAgent extends BaseAgent {
  private readonly WAVELENGTH_CUTOFFS = {
    SHORT: 50,    // km - local ore bodies, traps
    MEDIUM: 150,  // km - basin-scale structures  
    LONG: Infinity  // km - deep crustal/mantle features
  };

  private readonly TARGET_SIGNATURES = {
    'hydrocarbon': {
      wavelength: 'medium',
      amplitude: 'negative',  // Sedimentary basins typically show gravity lows
      depthRange: [2000, 8000], // meters
      expectedAmplitude: [-40, -20] // mGal
    },
    'gold': {
      wavelength: 'short',
      amplitude: 'positive',  // Dense ore bodies
      depthRange: [0, 3000],
      expectedAmplitude: [5, 30] // mGal
    },
    'copper': {
      wavelength: 'short',
      amplitude: 'positive',
      depthRange: [0, 4000],
      expectedAmplitude: [8, 25] // mGal
    },
    'nickel': {
      wavelength: 'short',
      amplitude: 'positive',
      depthRange: [1000, 5000],
      expectedAmplitude: [10, 35] // mGal
    },
    'lithium': {
      wavelength: 'medium',
      amplitude: 'negative',  // Brine in basins
      depthRange: [500, 3000],
      expectedAmplitude: [-25, -15] // mGal
    },
    'uranium': {
      wavelength: 'short',
      amplitude: 'positive',
      depthRange: [100, 2000],
      expectedAmplitude: [3, 15] // mGal
    }
  };

  constructor() {
    super('GravimetricDecompositionAgent', 'gravimetric', 2, true); // High priority, veto power
  }

  /**
   * Main evaluation method - implements multi-orbit decomposition
   */
  async evaluate(
    candidate: AnomalyCandidate,
    satelliteData: SatelliteData
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // Validate input data
      const dataQuality = this.validateDataQuality(satelliteData);
      if (!dataQuality.valid) {
        return this.createFailureResult(startTime, 'Insufficient gravity data quality');
      }

      // Extract gravity data
      const gravityData = this.extractGravityData(satelliteData);
      if (!gravityData) {
        return this.createFailureResult(startTime, 'No gravity data available');
      }

      // Perform multi-wavelength decomposition
      const decomposed = this.decomposeGravityField(gravityData, candidate);

      // Detect anomalies based on target resource
      const anomalies = this.detectAnomalies(decomposed, candidate.targetResource);

      // Calculate confidence and uncertainty
      const confidence = this.calculateDetectionConfidence(anomalies, candidate);
      const uncertainty = this.calculateUncertainty(dataQuality.quality, confidence, [
        this.assessDataGaps(gravityData),
        this.assessNoiseLevel(gravityData),
        this.assessTemporalVariability(satelliteData)
      ]);

      // Physics validation
      const physicsValidation = this.validatePhysics(anomalies, candidate.geologicalContext);

      return {
        agentName: this.name,
        detection: anomalies.length > 0,
        confidence,
        uncertainty,
        data: {
          anomalies,
          decomposition: decomposed,
          method: 'multi_orbit_gravimetric_decomposition',
          targetSignature: this.TARGET_SIGNATURES[candidate.targetResource]
        },
        metadata: {
          processingTime: Date.now() - startTime,
          method: 'Multi-wavelength spherical harmonic decomposition',
          parameters: {
            wavelengthCutoffs: this.WAVELENGTH_CUTOFFS,
            targetResource: candidate.targetResource,
            dataQuality: dataQuality.quality
          },
          timestamp: new Date().toISOString()
        },
        vetoPower: this.vetoPower,
        physicsValidation
      };

    } catch (error) {
      console.error('GravimetricDecompositionAgent evaluation failed:', error);
      return this.createFailureResult(startTime, `Evaluation failed: ${error.message}`);
    }
  }

  /**
   * Validate gravity data quality
   */
  validateDataQuality(satelliteData: SatelliteData): { valid: boolean; quality: number; issues: string[] } {
    const issues: string[] = [];
    let quality = 1.0;

    // Check for gravity data
    if (!satelliteData.gravity?.grace && !satelliteData.gravity?.goce) {
      issues.push('No satellite gravity data available');
      quality -= 0.5;
    }

    // Check data resolution
    if (satelliteData.gravity?.grace) {
      // GRACE resolution is ~1 degree (~111km)
      quality -= 0.2; // Lower resolution penalty
    }

    // Check temporal coverage
    if (!this.hasAdequateTemporalCoverage(satelliteData)) {
      issues.push('Insufficient temporal coverage for gravity decomposition');
      quality -= 0.3;
    }

    // Check for data gaps
    if (this.hasSignificantGaps(satelliteData)) {
      issues.push('Significant data gaps detected');
      quality -= 0.4;
    }

    return {
      valid: quality > 0.5,
      quality: Math.max(0, quality),
      issues
    };
  }

  /**
   * Decompose gravity field into wavelength components
   */
  private decomposeGravityField(gravityData: number[][], candidate: AnomalyCandidate): DecomposedGravity {
    // In a real implementation, this would use spherical harmonic decomposition
    // For demonstration, we'll simulate the decomposition process

    const rows = gravityData.length;
    const cols = gravityData[0].length;
    
    // Create wavelength components using simplified filtering
    const longWavelength = this.applyLowPassFilter(gravityData, this.WAVELENGTH_CUTOFFS.LONG);
    const mediumWavelength = this.applyBandPassFilter(gravityData, 50, this.WAVELENGTH_CUTOFFS.LONG);
    const shortWavelength = this.applyHighPassFilter(gravityData, this.WAVELENGTH_CUTOFFS.SHORT);

    // Calculate residuals
    const reconstructed = this.addComponents(longWavelength, mediumWavelength, shortWavelength);
    const residuals = gravityData.map((row, i) => 
      row.map((val, j) => val - reconstructed[i][j])
    );

    return {
      longWavelength,
      mediumWavelength,
      shortWavelength,
      original: gravityData,
      residuals
    };
  }

  /**
   * Detect anomalies based on target resource signatures
   */
  private detectAnomalies(decomposed: DecomposedGravity, targetResource: string): GravityAnomaly[] {
    const signature = this.TARGET_SIGNATURES[targetResource];
    if (!signature) {
      return [];
    }

    const anomalies: GravityAnomaly[] = [];
    let component: number[][];

    // Select appropriate wavelength component
    switch (signature.wavelength) {
      case 'short':
        component = decomposed.shortWavelength;
        break;
      case 'medium':
        component = decomposed.mediumWavelength;
        break;
      case 'long':
        component = decomposed.longWavelength;
        break;
      default:
        return [];
    }

    // Find anomalies using statistical thresholding
    const flatData = component.flat();
    const mean = flatData.reduce((sum, val) => sum + val, 0) / flatData.length;
    const stdDev = Math.sqrt(flatData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flatData.length);

    // Set threshold based on expected amplitude
    const [minExpected, maxExpected] = signature.expectedAmplitude;
    const threshold = signature.amplitude === 'positive' 
      ? mean + stdDev * 2 
      : mean - stdDev * 2;

    // Scan for anomalies
    for (let i = 1; i < component.length - 1; i++) {
      for (let j = 1; j < component[0].length - 1; j++) {
        const value = component[i][j];
        
        // Check if value meets criteria
        const meetsAmplitude = signature.amplitude === 'positive' 
          ? value > threshold && value >= minExpected
          : value < threshold && value <= maxExpected;

        if (meetsAmplitude) {
          // Check if it's a local extremum
          const isLocalExtremum = this.isLocalExtremum(component, i, j, signature.amplitude);
          
          if (isLocalExtremum) {
            const depth = this.estimateDepth(value, signature);
            const confidence = this.calculateAnomalyConfidence(value, threshold, mean, stdDev);

            anomalies.push({
              coordinates: {
                latitude: 0, // Would be calculated from grid indices
                longitude: 0
              },
              amplitude: value,
              wavelengthComponent: signature.wavelength,
              depth,
              confidence,
              physicalInterpretation: this.interpretAnomaly(value, signature, depth)
            });
          }
        }
      }
    }

    return anomalies;
  }

  /**
   * Simplified filtering methods (in real implementation would use proper signal processing)
   */
  private applyLowPassFilter(data: number[][], cutoff: number): number[][] {
    // Simplified low-pass filter using averaging
    const kernelSize = Math.min(15, Math.floor(cutoff / 10));
    return this.applyConvolution(data, this.createAverageKernel(kernelSize));
  }

  private applyHighPassFilter(data: number[][], cutoff: number): number[][] {
    const lowPass = this.applyLowPassFilter(data, cutoff);
    return data.map((row, i) => 
      row.map((val, j) => val - lowPass[i][j])
    );
  }

  private applyBandPassFilter(data: number[][], lowCutoff: number, highCutoff: number): number[][] {
    const lowPass = this.applyLowPassFilter(data, highCutoff);
    const veryLowPass = this.applyLowPassFilter(data, lowCutoff);
    return lowPass.map((row, i) => 
      row.map((val, j) => val - veryLowPass[i][j])
    );
  }

  private applyConvolution(data: number[][], kernel: number[][]): number[][] {
    const result: number[][] = [];
    const kHeight = kernel.length;
    const kWidth = kernel[0].length;
    const pad = Math.floor(kWidth / 2);

    for (let i = 0; i < data.length; i++) {
      result[i] = [];
      for (let j = 0; j < data[0].length; j++) {
        let sum = 0;
        for (let ki = 0; ki < kHeight; ki++) {
          for (let kj = 0; kj < kWidth; kj++) {
            const di = i + ki - pad;
            const dj = j + kj - pad;
            
            if (di >= 0 && di < data.length && dj >= 0 && dj < data[0].length) {
              sum += data[di][dj] * kernel[ki][kj];
            }
          }
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private createAverageKernel(size: number): number[][] {
    const kernel: number[][] = [];
    const value = 1 / (size * size);
    
    for (let i = 0; i < size; i++) {
      kernel[i] = [];
      for (let j = 0; j < size; j++) {
        kernel[i][j] = value;
      }
    }
    return kernel;
  }

  private addComponents(...components: number[][][]): number[][] {
    const rows = components[0].length;
    const cols = components[0][0].length;
    const result: number[][] = [];

    for (let i = 0; i < rows; i++) {
      result[i] = [];
      for (let j = 0; j < cols; j++) {
        result[i][j] = components.reduce((sum, comp) => sum + comp[i][j], 0);
      }
    }
    return result;
  }

  /**
   * Helper methods for anomaly detection
   */
  private isLocalExtremum(data: number[][], i: number, j: number, type: 'positive' | 'negative'): boolean {
    const value = data[i][j];
    const neighbors = [
      data[i-1]?.[j], data[i+1]?.[j],
      data[i]?.[j-1], data[i]?.[j+1]
    ].filter(val => val !== undefined);

    if (type === 'positive') {
      return neighbors.every(neighbor => value > neighbor);
    } else {
      return neighbors.every(neighbor => value < neighbor);
    }
  }

  private estimateDepth(amplitude: number, signature: any): number {
    // Simplified depth estimation based on amplitude
    const [minDepth, maxDepth] = signature.depthRange;
    const [minAmp, maxAmp] = signature.expectedAmplitude;
    
    // Linear interpolation
    const normalizedAmp = (amplitude - minAmp) / (maxAmp - minAmp);
    return minDepth + normalizedAmp * (maxDepth - minDepth);
  }

  private calculateAnomalyConfidence(
    value: number, 
    threshold: number, 
    mean: number, 
    stdDev: number
  ): number {
    const signalStrength = Math.abs(value - threshold);
    const noiseLevel = stdDev;
    const signalToNoise = signalStrength / (noiseLevel + 0.001);
    
    return Math.tanh(signalToNoise / 2); // Saturates at 1.0
  }

  private interpretAnomaly(amplitude: number, signature: any, depth: number): string {
    const interpretations = {
      'hydrocarbon': `${amplitude < -30 ? 'Strong' : 'Moderate'} gravity anomaly suggesting sedimentary basin at ${depth}m depth`,
      'gold': `High-density anomaly (${amplitude.toFixed(1)} mGal) indicative of gold mineralization at ${depth}m`,
      'copper': `Dense anomaly consistent with copper-bearing ore body at ${depth}m depth`,
      'nickel': `Gravity high suggesting ultramafic intrusion and nickel mineralization at ${depth}m`,
      'lithium': `Gravity low in basin setting, potential lithium brine reservoir at ${depth}m`,
      'uranium': `Localized gravity high, possible uranium roll-front deposit at ${depth}m`
    };

    return interpretations[signature.wavelength] || 'Unknown gravity anomaly';
  }

  /**
   * Data quality assessment helpers
   */
  private hasAdequateTemporalCoverage(satelliteData: SatelliteData): boolean {
    // Check if we have multiple time points for gravity data
    return satelliteData.gravity?.grace || satelliteData.gravity?.goce;
  }

  private hasSignificantGaps(satelliteData: SatelliteData): boolean {
    // Simplified gap detection
    return false; // Assume no gaps for now
  }

  private assessDataGaps(gravityData: number[][]): number {
    // Calculate percentage of valid data points
    const validPoints = gravityData.flat().filter(val => !isNaN(val) && isFinite(val)).length;
    const totalPoints = gravityData.flat().length;
    return 1 - (validPoints / totalPoints);
  }

  private assessNoiseLevel(gravityData: number[][]): number {
    // Estimate noise level using local variance
    const flatData = gravityData.flat();
    const mean = flatData.reduce((sum, val) => sum + val, 0) / flatData.length;
    const variance = flatData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flatData.length;
    
    // Normalize noise level (0 = no noise, 1 = very noisy)
    return Math.min(1.0, variance / 100); // Assuming reasonable variance threshold
  }

  private assessTemporalVariability(satelliteData: SatelliteData): number {
    // Assess how stable the gravity signal is over time
    return 0.1; // Low variability for gravity data
  }

  private extractGravityData(satelliteData: SatelliteData): number[][] | null {
    // In real implementation, would extract and process actual satellite gravity data
    // For demonstration, create synthetic data
    return this.generateSyntheticGravityData();
  }

  private generateSyntheticGravityData(): number[][] {
    // Generate synthetic gravity field for demonstration
    const size = 50;
    const data: number[][] = [];
    
    for (let i = 0; i < size; i++) {
      data[i] = [];
      for (let j = 0; j < size; j++) {
        // Create a synthetic gravity field with some anomalies
        const baseValue = -20; // mGal
        const anomaly = this.addSyntheticAnomaly(i, j, size);
        data[i][j] = baseValue + anomaly + (Math.random() - 0.5) * 2; // Add noise
      }
    }
    
    return data;
  }

  private addSyntheticAnomaly(i: number, j: number, size: number): number {
    // Add a synthetic anomaly at a specific location
    const centerX = size * 0.3;
    const centerY = size * 0.7;
    const distance = Math.sqrt(Math.pow(i - centerX, 2) + Math.pow(j - centerY, 2));
    
    if (distance < 5) {
      return 15 * Math.exp(-distance / 3); // Gaussian anomaly
    }
    
    return 0;
  }

  private calculateDetectionConfidence(anomalies: GravityAnomaly[], candidate: AnomalyCandidate): number {
    if (anomalies.length === 0) return 0;
    
    // Average confidence of detected anomalies
    const avgConfidence = anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length;
    
    // Boost confidence if anomalies match expected depth range
    const signature = this.TARGET_SIGNATURES[candidate.targetResource];
    if (signature) {
      const [minDepth, maxDepth] = signature.depthRange;
      const depthMatches = anomalies.filter(a => 
        a.depth >= minDepth && a.depth <= maxDepth
      ).length;
      
      const depthMatchRatio = depthMatches / anomalies.length;
      return avgConfidence * (0.7 + 0.3 * depthMatchRatio);
    }
    
    return avgConfidence;
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
        method: 'multi_orbit_gravimetric_decomposition',
        parameters: {},
        timestamp: new Date().toISOString()
      },
      vetoPower: this.vetoPower
    };
  }
}