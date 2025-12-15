/**
 * GeoRNG - Deterministic Geospatial Random Number Generator
 * 
 * Physics-based deterministic random number generation for subsurface modeling
 * Ensures reproducible results based on geographic coordinates
 */

export interface GeologyContext {
  type: 'basin' | 'craton' | 'orogen' | 'shield' | 'platform';
  age: string; // e.g., "Paleozoic", "Mesozoic"
  composition: string; // e.g., "sedimentary", "igneous", "metamorphic"
}

export interface AnomalyResult {
  type: 'gravity' | 'magnetic' | 'thermal' | 'spectral';
  value: number;
  unit: string;
  confidence: number;
  depth: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface PhysicsConstraints {
  maxDepth: number; // meters
  minDepth: number; // meters
  maxGradient: number; // rate of change per km
  physicalLimits: {
    gravity: { min: number; max: number }; // mGal
    magnetic: { min: number; max: number }; // nT
    thermal: { min: number; max: number }; // °C
  };
}

export class GeoRNG {
  private seed: number;
  private coordinates: { lat: number; lon: number };
  private geologyContext: GeologyContext;
  private physicsConstraints: PhysicsConstraints;

  constructor(lat: number, lon: number, geologyContext: GeologyContext) {
    this.coordinates = { lat, lon };
    this.geologyContext = geologyContext;
    this.seed = this.generateDeterministicSeed(lat, lon);
    this.physicsConstraints = this.getPhysicsConstraints(geologyContext);
  }

  /**
   * Generate deterministic seed from coordinates
   * Ensures same coordinates always produce same seed
   */
  private generateDeterministicSeed(lat: number, lon: number): number {
    // Use prime numbers for better distribution
    const latPrime = 9001;
    const lonPrime = 7001;
    const combined = (lat + 90) * latPrime + (lon + 180) * lonPrime;
    return Math.floor(combined * 1000000) % 2147483647; // Keep within 32-bit integer range
  }

  /**
   * Linear Congruential Generator for deterministic random numbers
   */
  private deterministicRandom(): number {
    // LCG parameters from Numerical Recipes
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Generate Gaussian distribution using Box-Muller transform
   */
  private gaussianRandom(mean: number = 0, stdDev: number = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = this.deterministicRandom();
    while (v === 0) v = this.deterministicRandom();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z0 * stdDev + mean;
  }

  /**
   * Get physics-based constraints for different geological contexts
   */
  private getPhysicsConstraints(geology: GeologyContext): PhysicsConstraints {
    const constraints = {
      basin: {
        maxDepth: 8000,
        minDepth: 500,
        maxGradient: 50,
        physicalLimits: {
          gravity: { min: -60, max: -20 },
          magnetic: { min: 48000, max: 52000 },
          thermal: { min: 12, max: 25 }
        }
      },
      craton: {
        maxDepth: 6000,
        minDepth: 200,
        maxGradient: 30,
        physicalLimits: {
          gravity: { min: -30, max: -5 },
          magnetic: { min: 54000, max: 62000 },
          thermal: { min: 8, max: 18 }
        }
      },
      orogen: {
        maxDepth: 12000,
        minDepth: 1000,
        maxGradient: 80,
        physicalLimits: {
          gravity: { min: -80, max: -30 },
          magnetic: { min: 50000, max: 65000 },
          thermal: { min: 15, max: 35 }
        }
      },
      shield: {
        maxDepth: 4000,
        minDepth: 100,
        maxGradient: 20,
        physicalLimits: {
          gravity: { min: -20, max: 5 },
          magnetic: { min: 58000, max: 68000 },
          thermal: { min: 5, max: 15 }
        }
      },
      platform: {
        maxDepth: 5000,
        minDepth: 300,
        maxGradient: 40,
        physicalLimits: {
          gravity: { min: -40, max: -15 },
          magnetic: { min: 50000, max: 56000 },
          thermal: { min: 10, max: 20 }
        }
      }
    };

    return constraints[geology.type] || constraints.platform;
  }

  /**
   * Generate gravity anomaly based on geological context
   */
  public generateGravityAnomaly(
    latitude: number,
    longitude: number,
    depth: number
  ): AnomalyResult {
    const limits = this.physicsConstraints.physicalLimits.gravity;
    const baseValue = (limits.min + limits.max) / 2;
    const variation = (limits.max - limits.min) / 4;
    
    // Depth-dependent attenuation
    const depthFactor = Math.exp(-depth / 3000); // Exponential decay with depth
    
    // Gaussian distribution around base value
    const value = this.gaussianRandom(baseValue, variation) * depthFactor;
    
    // Clamp to physical limits
    const clampedValue = Math.max(limits.min, Math.min(limits.max, value));
    
    // Confidence based on how well it fits expected models
    const confidence = Math.max(0.3, 1 - Math.abs(clampedValue - baseValue) / variation);
    
    return {
      type: 'gravity',
      value: clampedValue,
      unit: 'mGal',
      confidence,
      depth,
      coordinates: { latitude, longitude }
    };
  }

  /**
   * Generate magnetic anomaly based on geological context
   */
  public generateMagneticAnomaly(
    latitude: number,
    longitude: number,
    depth: number
  ): AnomalyResult {
    const limits = this.physicsConstraints.physicalLimits.magnetic;
    const baseValue = (limits.min + limits.max) / 2;
    const variation = (limits.max - limits.min) / 6;
    
    // Depth-dependent attenuation (magnetic signals decay faster)
    const depthFactor = Math.exp(-depth / 2000);
    
    // Consider magnetic susceptibility of rock type
    const susceptibilityFactor = this.getMagneticSusceptibility();
    
    const value = this.gaussianRandom(baseValue, variation) * depthFactor * susceptibilityFactor;
    const clampedValue = Math.max(limits.min, Math.min(limits.max, value));
    
    const confidence = Math.max(0.3, 1 - Math.abs(clampedValue - baseValue) / variation);
    
    return {
      type: 'magnetic',
      value: clampedValue,
      unit: 'nT',
      confidence,
      depth,
      coordinates: { latitude, longitude }
    };
  }

  /**
   * Generate thermal anomaly based on geological context
   */
  public generateThermalAnomaly(
    latitude: number,
    longitude: number,
    depth: number
  ): AnomalyResult {
    const limits = this.physicsConstraints.physicalLimits.thermal;
    
    // Geothermal gradient (typically 25-30°C/km)
    const surfaceTemp = 15; // Average surface temperature
    const gradient = 28; // °C/km average
    const expectedTemp = surfaceTemp + (depth / 1000) * gradient;
    
    // Add variation based on geological context
    const variation = 5 + this.deterministicRandom() * 3;
    const value = expectedTemp + this.gaussianRandom(0, variation);
    
    const clampedValue = Math.max(limits.min, Math.min(limits.max, value));
    
    // Thermal anomalies are more reliable at depth
    const confidence = Math.min(0.95, 0.4 + (depth / 10000));
    
    return {
      type: 'thermal',
      value: clampedValue,
      unit: '°C',
      confidence,
      depth,
      coordinates: { latitude, longitude }
    };
  }

  /**
   * Generate spectral anomaly (simplified model)
   */
  public generateSpectralAnomaly(
    latitude: number,
    longitude: number,
    depth: number
  ): AnomalyResult {
    // Spectral anomalies are typically surface or near-surface
    const effectiveDepth = Math.min(depth, 500);
    
    // Base spectral response varies by geology
    const baseResponse = this.getSpectralBaseResponse();
    const variation = baseResponse * 0.3;
    
    const value = baseResponse + this.gaussianRandom(0, variation);
    const confidence = Math.max(0.2, 1 - (effectiveDepth / 500));
    
    return {
      type: 'spectral',
      value: Math.max(0, value),
      unit: 'reflectance',
      confidence,
      depth: effectiveDepth,
      coordinates: { latitude, longitude }
    };
  }

  /**
   * Get magnetic susceptibility factor based on geology
   */
  private getMagneticSusceptibility(): number {
    const susceptibility = {
      'basin': 0.8,      // Sedimentary rocks typically less magnetic
      'craton': 1.2,     // Stable continental interiors
      'orogen': 1.5,     // Metamorphic and igneous activity
      'shield': 1.8,     // Highly magnetic basement rocks
      'platform': 1.0    // Mixed geology
    };
    
    return susceptibility[this.geologyContext.type] || 1.0;
  }

  /**
   * Get base spectral response for different geologies
   */
  private getSpectralBaseResponse(): number {
    const spectralResponse = {
      'basin': 0.3,      // Sedimentary reflectance
      'craton': 0.5,     // Continental rocks
      'orogen': 0.7,     // Mountainous regions
      'shield': 0.4,     // Ancient rocks
      'platform': 0.45   // Mixed response
    };
    
    return spectralResponse[this.geologyContext.type] || 0.5;
  }

  /**
   * Generate a complete set of anomalies for a location
   */
  public generateAnomalySet(
    latitude: number,
    longitude: number,
    depth: number
  ): AnomalyResult[] {
    return [
      this.generateGravityAnomaly(latitude, longitude, depth),
      this.generateMagneticAnomaly(latitude, longitude, depth),
      this.generateThermalAnomaly(latitude, longitude, depth),
      this.generateSpectralAnomaly(latitude, longitude, depth)
    ];
  }

  /**
   * Validate if a set of anomalies is physically consistent
   */
  public validateAnomalyConsistency(anomalies: AnomalyResult[]): {
    isValid: boolean;
    confidence: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let totalConfidence = 0;
    
    // Check depth consistency
    const depths = anomalies.map(a => a.depth);
    const depthVariance = this.calculateVariance(depths);
    if (depthVariance > 1000000) { // Large depth variance
      issues.push('High depth variance between measurements');
    }
    
    // Check physical limits
    for (const anomaly of anomalies) {
      totalConfidence += anomaly.confidence;
      
      const limits = this.physicsConstraints.physicalLimits[anomaly.type];
      if (limits && (anomaly.value < limits.min || anomaly.value > limits.max)) {
        issues.push(`${anomaly.type} value outside physical limits`);
      }
    }
    
    const averageConfidence = totalConfidence / anomalies.length;
    const isValid = issues.length === 0 && averageConfidence > 0.5;
    
    return {
      isValid,
      confidence: averageConfidence,
      issues
    };
  }

  /**
   * Calculate variance of an array of numbers
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
}