import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;
const HTTP_PORT = process.env.HTTP_PORT || 3002;

// Create HTTP server for health checks
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'aurora-osi-realtime',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store active campaigns and their connections
const activeCampaigns = new Map();
const connectedClients = new Map();

// Simulated real-time data generation
class RealTimeDataSimulator {
  constructor() {
    this.intervals = new Map();
  }

  startCampaignSimulation(campaignId, socket) {
    // Clear existing interval for this campaign
    if (this.intervals.has(campaignId)) {
      clearInterval(this.intervals.get(campaignId));
    }

    // Generate new data every 3-5 seconds
    const interval = setInterval(() => {
      const data = this.generateCampaignUpdate(campaignId);
      socket.emit('campaign_update', data);
      
      // Broadcast to all clients subscribed to this campaign
      io.to(`campaign:${campaignId}`).emit('campaign_update', data);
    }, 3000 + Math.random() * 2000);

    this.intervals.set(campaignId, interval);
  }

  stopCampaignSimulation(campaignId) {
    if (this.intervals.has(campaignId)) {
      clearInterval(this.intervals.get(campaignId));
      this.intervals.delete(campaignId);
    }
  }

  generateCampaignUpdate(campaignId) {
    const anomalyTypes = ['gravity', 'magnetic', 'thermal', 'spectral'];
    const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    
    return {
      campaignId,
      timestamp: new Date().toISOString(),
      type: 'anomaly_detected',
      data: {
        anomalyType: type,
        confidence: 0.5 + Math.random() * 0.5,
        value: Math.random() * 100,
        coordinates: {
          latitude: (Math.random() - 0.5) * 0.1, // Small random offset
          longitude: (Math.random() - 0.5) * 0.1
        },
        depth: 1000 + Math.random() * 4000,
        volume: 100000 + Math.random() * 900000
      }
    };
  }

  generateSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      type: 'system_status',
      data: {
        activeSensors: 12 + Math.floor(Math.random() * 3),
        processingEfficiency: 95 + Math.random() * 5,
        totalAnomalies: 247 + Math.floor(Math.random() * 20),
        aiModelAccuracy: 0.85 + Math.random() * 0.1,
        satelliteConnections: ['Sentinel-1', 'Landsat-9', 'GOCE'].filter(() => Math.random() > 0.1)
      }
    };
  }
}

const simulator = new RealTimeDataSimulator();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  connectedClients.set(socket.id, {
    connectedAt: new Date(),
    campaigns: []
  });

  // Send initial system status
  socket.emit('system_status', simulator.generateSystemStatus());

  // Subscribe to campaign updates
  socket.on('subscribe_campaign', (campaignId) => {
    console.log(`Client ${socket.id} subscribing to campaign ${campaignId}`);
    socket.join(`campaign:${campaignId}`);
    
    const clientData = connectedClients.get(socket.id);
    if (clientData) {
      clientData.campaigns.push(campaignId);
    }

    // Start real-time simulation for this campaign
    if (!activeCampaigns.has(campaignId)) {
      activeCampaigns.set(campaignId, { subscribers: 1 });
      simulator.startCampaignSimulation(campaignId, socket);
    } else {
      activeCampaigns.get(campaignId).subscribers++;
    }
  });

  // Unsubscribe from campaign updates
  socket.on('unsubscribe_campaign', (campaignId) => {
    console.log(`Client ${socket.id} unsubscribing from campaign ${campaignId}`);
    socket.leave(`campaign:${campaignId}`);
    
    const clientData = connectedClients.get(socket.id);
    if (clientData) {
      clientData.campaigns = clientData.campaigns.filter(id => id !== campaignId);
    }

    // Stop simulation if no more subscribers
    if (activeCampaigns.has(campaignId)) {
      const campaign = activeCampaigns.get(campaignId);
      campaign.subscribers--;
      if (campaign.subscribers <= 0) {
        activeCampaigns.delete(campaignId);
        simulator.stopCampaignSimulation(campaignId);
      }
    }
  });

  // Handle anomaly generation requests
  socket.on('generate_anomalies', async (data) => {
    const { campaignId, count = 10 } = data;
    console.log(`Generating ${count} anomalies for campaign ${campaignId}`);
    
    // Simulate anomaly generation process
    setTimeout(() => {
      const anomalies = [];
      for (let i = 0; i < count; i++) {
        anomalies.push({
          id: `anomaly_${Date.now()}_${i}`,
          campaignId,
          type: ['gravity', 'magnetic', 'thermal', 'spectral'][Math.floor(Math.random() * 4)],
          confidence: 0.5 + Math.random() * 0.5,
          value: Math.random() * 100,
          coordinates: {
            latitude: (Math.random() - 0.5) * 0.1,
            longitude: (Math.random() - 0.5) * 0.1
          },
          depth: 1000 + Math.random() * 4000,
          volume: 100000 + Math.random() * 900000,
          createdAt: new Date().toISOString()
        });
      }
      
      socket.emit('anomalies_generated', {
        campaignId,
        anomalies,
        count: anomalies.length
      });
      
      // Broadcast to all subscribers
      io.to(`campaign:${campaignId}`).emit('anomalies_generated', {
        campaignId,
        anomalies,
        count: anomalies.length
      });
    }, 2000); // Simulate processing time
  });

  // Handle prediction requests
  socket.on('generate_predictions', async (data) => {
    const { campaignId, timeHorizon = 5 } = data;
    console.log(`Generating predictions for campaign ${campaignId}, horizon: ${timeHorizon}`);
    
    // Simulate AI prediction process
    setTimeout(() => {
      const predictions = [];
      const currentYear = new Date().getFullYear();
      
      for (let year = 1; year <= timeHorizon; year++) {
        const targetYear = currentYear + year;
        ['base', 'optimistic', 'pessimistic'].forEach(scenario => {
          const multiplier = scenario === 'optimistic' ? 1.2 : scenario === 'pessimistic' ? 0.8 : 1.0;
          predictions.push({
            id: `pred_${Date.now()}_${year}_${scenario}`,
            campaignId,
            targetYear,
            scenario,
            volumeM3: (1000000 + Math.random() * 5000000) * multiplier,
            confidence: Math.max(0.3, 0.9 - (year * 0.1)),
            uncertainty: year * 0.05,
            modelVersion: 'v4.0.0-zai',
            createdAt: new Date().toISOString()
          });
        });
      }
      
      socket.emit('predictions_generated', {
        campaignId,
        predictions,
        count: predictions.length
      });
      
      // Broadcast to all subscribers
      io.to(`campaign:${campaignId}`).emit('predictions_generated', {
        campaignId,
        predictions,
        count: predictions.length
      });
    }, 3000); // Simulate AI processing time
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const clientData = connectedClients.get(socket.id);
    
    if (clientData) {
      // Unsubscribe from all campaigns
      clientData.campaigns.forEach(campaignId => {
        socket.leave(`campaign:${campaignId}`);
        
        if (activeCampaigns.has(campaignId)) {
          const campaign = activeCampaigns.get(campaignId);
          campaign.subscribers--;
          if (campaign.subscribers <= 0) {
            activeCampaigns.delete(campaignId);
            simulator.stopCampaignSimulation(campaignId);
          }
        }
      });
    }
    
    connectedClients.delete(socket.id);
  });
});

// Broadcast system status every 30 seconds
setInterval(() => {
  const status = simulator.generateSystemStatus();
  io.emit('system_status', status);
}, 30000);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Aurora OSI Real-time Service running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔗 WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Clear all intervals
  simulator.intervals.forEach(interval => clearInterval(interval));
  
  // Close server
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  
  // Clear all intervals
  simulator.intervals.forEach(interval => clearInterval(interval));
  
  // Close server
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});