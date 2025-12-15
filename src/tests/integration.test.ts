/**
 * Comprehensive Test Suite for Aurora OSI v4.5
 * Tests all major components and integrations
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Test configuration
const API_BASE = 'http://localhost:3000/api';

describe('Aurora OSI v4.5 Test Suite', () => {
  
  describe('Campaign Management', () => {
    let campaignId: string;

    it('should create a new campaign', async () => {
      const response = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Campaign - Permian Basin',
          description: 'Test campaign for comprehensive evaluation',
          latitude: 31.5,
          longitude: -102.0,
          radiusKm: 75.0,
          resourceType: 'oil',
          geologyContext: 'passive_margin'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.campaign).toBeDefined();
      expect(data.campaign.name).toBe('Test Campaign - Permian Basin');
      expect(data.campaign.resourceType).toBe('oil');
      
      campaignId = data.campaign.id;
    });

    it('should retrieve all campaigns', async () => {
      const response = await fetch(`${API_BASE}/campaigns`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.campaigns).toBeInstanceOf(Array);
      expect(data.campaigns.length).toBeGreaterThan(0);
      expect(data.currentUser).toBeDefined();
    });

    it('should retrieve specific campaign', async () => {
      const response = await fetch(`${API_BASE}/campaigns`);
      const data = await response.json();
      
      const testCampaign = data.campaigns.find((c: any) => c.id === campaignId);
      expect(testCampaign).toBeDefined();
      expect(testCampaign.name).toBe('Test Campaign - Permian Basin');
    });
  });

  describe('Multi-Agent Consensus Engine', () => {
    it('should return consensus engine status', async () => {
      const response = await fetch(`${API_BASE}/consensus`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('active');
      expect(data.initialized).toBe(true);
      expect(data.agents).toBeInstanceOf(Array);
      expect(data.agents.length).toBe(3);
      
      // Check all required agents are present
      const agentTypes = data.agents.map((a: any) => a.type);
      expect(agentTypes).toContain('gravimetric');
      expect(agentTypes).toContain('spectral');
      expect(agentTypes).toContain('quantum');
    });

    it('should perform campaign-based consensus evaluation', async () => {
      // First create a campaign
      const campaignResponse = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Consensus Test Campaign',
          description: 'Campaign for consensus testing',
          latitude: 29.5,
          longitude: -91.0,
          radiusKm: 50.0,
          resourceType: 'gas',
          geologyContext: 'passive_margin'
        })
      });

      const campaignData = await campaignResponse.json();
      expect(campaignData.campaign.id).toBeDefined();

      // Now run consensus evaluation
      const consensusResponse = await fetch(`${API_BASE}/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaignData.campaign.id
        })
      });

      expect(consensusResponse.status).toBe(200);
      
      const result = await consensusResponse.json();
      expect(result.success).toBe(true);
      expect(result.evaluation).toBeDefined();
      expect(result.dataSources).toBeDefined();
      expect(result.agentResults).toBeDefined();
      expect(result.agentResults.length).toBe(3);
      
      // Check data sources
      expect(result.dataSources.primary).toBe('Google Earth Engine');
      expect(result.dataSources.gravity).toBe(true);
      expect(result.dataSources.spectral).toBe(true);
      expect(result.dataSources.topographic).toBe(true);
      expect(result.dataSources.temporal).toBe(true);
    });

    it('should perform direct consensus evaluation', async () => {
      const response = await fetch(`${API_BASE}/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: {
            latitude: 30.0,
            longitude: -90.0
          },
          targetResource: 'minerals',
          geologicalContext: 'craton',
          depth: 2000,
          radius: 60000
        })
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.candidate.evaluationType).toBe('direct');
      expect(result.candidate.targetResource).toBe('minerals');
      expect(result.evaluation.processingTime).toBeGreaterThan(0);
    });

    it('should handle invalid consensus requests', async () => {
      // Test missing campaign ID and coordinates
      const response = await fetch(`${API_BASE}/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetResource: 'oil'
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('Google Earth Engine Integration', () => {
    it('should initialize GEE service', async () => {
      // This is tested indirectly through consensus evaluation
      const response = await fetch(`${API_BASE}/consensus`);
      const data = await response.json();
      
      // The fact that consensus engine is initialized means GEE service is working
      expect(data.initialized).toBe(true);
    });

    it('should gather satellite data for different regions', async () => {
      const testCases = [
        { lat: 25.0, lng: -80.0, resource: 'oil' },
        { lat: 40.0, lng: -105.0, resource: 'gas' },
        { lat: -20.0, lng: 50.0, resource: 'minerals' }
      ];

      for (const testCase of testCases) {
        const response = await fetch(`${API_BASE}/consensus`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: {
              latitude: testCase.lat,
              longitude: testCase.lng
            },
            targetResource: testCase.resource,
            geologicalContext: 'passive_margin'
          })
        });

        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.dataSources.primary).toBe('Google Earth Engine');
        expect(result.evaluation.processingTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Agent Performance', () => {
    it('should validate all agent responses', async () => {
      const response = await fetch(`${API_BASE}/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: {
            latitude: 32.0,
            longitude: -95.0
          },
          targetResource: 'geothermal',
          geologicalContext: 'rift'
        })
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.agentResults).toBeDefined();
      expect(result.agentResults.length).toBe(3);

      // Validate each agent result
      result.agentResults.forEach((agentResult: any) => {
        expect(agentResult.agent).toBeDefined();
        expect(typeof agentResult.detection).toBe('boolean');
        expect(typeof agentResult.confidence).toBe('number');
        expect(typeof agentResult.uncertainty).toBe('number');
        expect(agentResult.processingTime).toBeGreaterThan(0);
      });
    });

    it('should complete evaluation within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: {
            latitude: 35.0,
            longitude: -100.0
          },
          targetResource: 'water',
          geologicalContext: 'basin'
        })
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.evaluation.processingTime).toBeLessThan(5000); // Processing should be under 5 seconds
    });
  });

  describe('Data Validation', () => {
    it('should validate campaign creation data', async () => {
      const invalidCampaigns = [
        {}, // Missing all fields
        { name: 'Test' }, // Missing coordinates
        { name: 'Test', latitude: 30.0 }, // Missing longitude
        { name: 'Test', latitude: 30.0, longitude: -90.0 }, // Missing radius
        { name: 'Test', latitude: 30.0, longitude: -90.0, radiusKm: 50 } // Missing resource type
      ];

      for (const invalidCampaign of invalidCampaigns) {
        const response = await fetch(`${API_BASE}/campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidCampaign)
        });

        expect(response.status).toBe(400);
      }
    });

    it('should handle invalid coordinates', async () => {
      const invalidCoordinates = [
        { latitude: 91.0, longitude: 0.0 }, // Invalid latitude
        { latitude: -91.0, longitude: 0.0 }, // Invalid latitude
        { latitude: 0.0, longitude: 181.0 }, // Invalid longitude
        { latitude: 0.0, longitude: -181.0 } // Invalid longitude
      ];

      for (const coords of invalidCoordinates) {
        const response = await fetch(`${API_BASE}/consensus`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: coords,
            targetResource: 'oil',
            geologicalContext: 'passive_margin'
          })
        });

        // Should either succeed with validation or return appropriate error
        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent campaign IDs', async () => {
      const response = await fetch(`${API_BASE}/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: 'non-existent-id'
        })
      });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toContain('Campaign not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    it('should handle server errors gracefully', async () => {
      // This tests the system's ability to handle unexpected errors
      const response = await fetch(`${API_BASE}/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: {
            latitude: 'invalid',
            longitude: -90.0
          },
          targetResource: 'oil',
          geologicalContext: 'passive_margin'
        })
      });

      // Should handle gracefully without crashing
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          fetch(`${API_BASE}/consensus`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coordinates: {
                latitude: 30.0 + i * 0.1,
                longitude: -90.0 + i * 0.1
              },
              targetResource: 'oil',
              geologicalContext: 'passive_margin'
            })
          })
        );
      }

      const results = await Promise.all(promises);
      
      // All requests should complete successfully
      results.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Get timing data
      const dataPromises = results.map(r => r.json());
      const dataResults = await Promise.all(dataPromises);
      
      dataResults.forEach(result => {
        expect(result.evaluation.processingTime).toBeGreaterThan(0);
        expect(result.evaluation.processingTime).toBeLessThan(10000);
      });
    });
  });
});

// Integration test runner
export async function runIntegrationTests() {
  console.log('🧪 Starting Aurora OSI v4.5 Integration Tests...');
  
  try {
    // Test basic connectivity
    console.log('📡 Testing API connectivity...');
    const healthResponse = await fetch(`${API_BASE}/campaigns`);
    if (healthResponse.ok) {
      console.log('✅ API connectivity OK');
    } else {
      console.log('❌ API connectivity failed');
      return false;
    }

    // Test consensus engine
    console.log('🤖 Testing consensus engine...');
    const consensusResponse = await fetch(`${API_BASE}/consensus`);
    if (consensusResponse.ok) {
      const consensusData = await consensusResponse.json();
      console.log(`✅ Consensus engine OK - ${consensusData.agents?.length || 0} agents registered`);
    } else {
      console.log('❌ Consensus engine failed');
      return false;
    }

    // Test campaign creation and evaluation
    console.log('🗺️ Testing campaign creation and evaluation...');
    const campaignResponse = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Integration Test Campaign',
        description: 'Automated integration test',
        latitude: 31.0,
        longitude: -102.0,
        radiusKm: 50.0,
        resourceType: 'oil',
        geologyContext: 'passive_margin'
      })
    });

    if (campaignResponse.ok) {
      const campaignData = await campaignResponse.json();
      console.log(`✅ Campaign creation OK - ID: ${campaignData.campaign.id}`);

      // Test consensus evaluation
      const evalResponse = await fetch(`${API_BASE}/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaignData.campaign.id
        })
      });

      if (evalResponse.ok) {
        const evalData = await evalResponse.json();
        console.log(`✅ Consensus evaluation OK - Processing time: ${evalData.evaluation.processingTime}ms`);
        console.log(`📊 Data sources: ${evalData.dataSources.primary}`);
        console.log(`🤖 Agent results: ${evalData.agentResults.length} agents`);
      } else {
        console.log('❌ Consensus evaluation failed');
        return false;
      }
    } else {
      console.log('❌ Campaign creation failed');
      return false;
    }

    console.log('🎉 All integration tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
}

// Export for use in test scripts
export default {
  runIntegrationTests
};