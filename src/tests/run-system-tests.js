#!/usr/bin/env node

/**
 * Aurora OSI v4.5 System Test Runner
 * Quick integration test to verify all components are working
 */

const API_BASE = 'http://localhost:3000/api';

async function runSystemTests() {
  console.log('🚀 Aurora OSI v4.5 System Test Runner');
  console.log('=====================================\n');

  let testsPassed = 0;
  let testsTotal = 0;

  function test(name, testFn) {
    testsTotal++;
    console.log(`🧪 ${name}...`);
    return testFn()
      .then(result => {
        if (result) {
          console.log(`✅ ${name} - PASSED\n`);
          testsPassed++;
        } else {
          console.log(`❌ ${name} - FAILED\n`);
        }
      })
      .catch(error => {
        console.log(`❌ ${name} - ERROR: ${error.message}\n`);
      });
  }

  // Test 1: API Connectivity
  await test('API Connectivity', async () => {
    const response = await fetch(`${API_BASE}/campaigns`);
    return response.ok;
  });

  // Test 2: Campaign Creation
  await test('Campaign Creation', async () => {
    const response = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'System Test Campaign',
        description: 'Automated system test',
        latitude: 31.0,
        longitude: -102.0,
        radiusKm: 50.0,
        resourceType: 'oil',
        geologyContext: 'passive_margin'
      })
    });
    
    if (!response.ok) return false;
    const data = await response.json();
    return data.campaign && data.campaign.id;
  });

  // Test 3: Consensus Engine Status
  await test('Consensus Engine Status', async () => {
    const response = await fetch(`${API_BASE}/consensus`);
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.status === 'active' && 
           data.initialized === true && 
           data.agents && 
           data.agents.length === 3;
  });

  // Test 4: Consensus Evaluation (Campaign-based)
  await test('Campaign-based Consensus Evaluation', async () => {
    // First create a campaign
    const campaignResponse = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Consensus Test Campaign',
        description: 'Testing consensus evaluation',
        latitude: 29.5,
        longitude: -91.0,
        radiusKm: 50.0,
        resourceType: 'gas',
        geologyContext: 'passive_margin'
      })
    });

    if (!campaignResponse.ok) return false;
    const campaignData = await campaignResponse.json();

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

    if (!consensusResponse.ok) return false;
    
    const result = await consensusResponse.json();
    return result.success === true && 
           result.evaluation && 
           result.dataSources && 
           result.agentResults &&
           result.agentResults.length === 3;
  });

  // Test 5: Direct Consensus Evaluation
  await test('Direct Consensus Evaluation', async () => {
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

    if (!response.ok) return false;
    
    const result = await response.json();
    return result.success === true && 
           result.candidate.evaluationType === 'direct' &&
           result.evaluation.processingTime > 0;
  });

  // Test 6: Google Earth Engine Integration
  await test('Google Earth Engine Integration', async () => {
    const response = await fetch(`${API_BASE}/consensus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: {
          latitude: 25.0,
          longitude: -80.0
        },
        targetResource: 'oil',
        geologicalContext: 'passive_margin'
      })
    });

    if (!response.ok) return false;
    
    const result = await response.json();
    return result.dataSources.primary === 'Google Earth Engine' &&
           result.dataSources.gravity === true &&
           result.dataSources.spectral === true &&
           result.dataSources.topographic === true &&
           result.dataSources.temporal === true;
  });

  // Test 7: Agent Performance
  await test('Agent Performance Validation', async () => {
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

    if (!response.ok) return false;
    
    const result = await response.json();
    if (!result.agentResults || result.agentResults.length !== 3) return false;

    // Validate each agent result
    for (const agentResult of result.agentResults) {
      if (!agentResult.agent || 
          typeof agentResult.detection !== 'boolean' ||
          typeof agentResult.confidence !== 'number' ||
          typeof agentResult.uncertainty !== 'number' ||
          agentResult.processingTime < 0) { // Allow 0 processing time for failed detections
        return false;
      }
    }
    
    return true;
  });

  // Test 8: Error Handling
  await test('Error Handling', async () => {
    // Test invalid campaign ID
    const response = await fetch(`${API_BASE}/consensus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId: 'non-existent-id'
      })
    });

    return response.status === 404;
  });

  // Test 9: Performance Benchmarks
  await test('Performance Benchmarks', async () => {
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

    const totalTime = Date.now() - startTime;
    
    if (!response.ok) return false;
    
    const result = await response.json();
    return totalTime < 10000 && // Should complete within 10 seconds
           result.evaluation.processingTime < 5000; // Processing should be under 5 seconds
  });

  // Test 10: Data Validation
  await test('Data Validation', async () => {
    // Test missing required fields
    const response = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test'
        // Missing required fields
      })
    });

    return response.status === 400;
  });

  // Results Summary
  console.log('=====================================');
  console.log(`📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed! Aurora OSI v4.5 is working correctly.');
    process.exit(0);
  } else {
    console.log(`❌ ${testsTotal - testsPassed} tests failed. Please check the system.`);
    process.exit(1);
  }
}

// Run the tests
runSystemTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});