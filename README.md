# Aurora OSI v4.0 - Predictive Subsurface Intelligence Platform

## Overview

Aurora OSI v4.0 is a cutting-edge predictive subsurface intelligence platform that leverages AI, satellite data, and deterministic physics modeling to revolutionize resource exploration and discovery.

### Key Features

- **Deterministic Physics Engine (GeoRNG)**: Physics-based random number generation ensuring reproducible results
- **Multi-Sensor Data Integration**: Sentinel-1, Landsat-9, GOCE satellite data harmonization
- **AI-Powered Predictions**: Temporal forecasting with confidence intervals
- **Real-Time Processing**: WebSocket-based live updates and anomaly detection
- **Interactive Visualization**: 3D subsurface modeling and cross-sectional analysis
- **Comprehensive Reporting**: Automated technical report generation with validation agents

## Architecture

### Frontend (Next.js 15 + TypeScript)
- **Location**: `/src/app/`
- **Technology Stack**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Key Components**:
  - Campaign Management
  - Interactive Map View
  - Anomaly Detection Dashboard
  - Temporal Predictions Interface
  - Real-time System Monitoring

### Backend (Next.js API Routes)
- **Location**: `/src/app/api/`
- **Technology Stack**: Next.js API Routes, Prisma ORM, SQLite
- **Key Endpoints**:
  - `/api/campaigns` - Campaign CRUD operations
  - `/api/anomalies` - Anomaly generation and retrieval
  - `/api/predictions` - AI-powered temporal predictions

### Physics Engine
- **Location**: `/src/lib/physics/georng.ts`
- **Features**:
  - Deterministic seeding based on coordinates
  - Physics-constrained anomaly generation
  - Multi-modal sensor simulation (gravity, magnetic, thermal, spectral)
  - Geological context awareness

### Real-time Service
- **Location**: `/mini-services/realtime-service/`
- **Technology Stack**: Socket.IO, Node.js, TypeScript
- **Features**:
  - Live anomaly detection
  - Real-time system status updates
  - Campaign subscription management
  - WebSocket-based communication

## Database Schema

### Core Models

#### Campaign
```typescript
interface Campaign {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  resourceType: 'oil' | 'gas' | 'minerals' | 'water' | 'geothermal';
  geologyContext?: 'basin' | 'craton' | 'orogen' | 'shield' | 'platform';
  status: 'active' | 'completed' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Anomaly
```typescript
interface Anomaly {
  id: string;
  campaignId: string;
  latitude: number;
  longitude: number;
  depthM?: number;
  probability: number; // 0-1 confidence score
  confidence: number; // statistical confidence
  anomalyType: 'gravity' | 'magnetic' | 'thermal' | 'spectral';
  value?: number; // measured value
  volumeM3?: number; // estimated volume
  resourceEstimate?: Json; // resource estimates
  physicsValidation?: Json; // physics validation results
  createdAt: Date;
  updatedAt: Date;
}
```

#### Prediction
```typescript
interface Prediction {
  id: string;
  campaignId: string;
  targetYear: number;
  resourceType: string;
  volumeM3?: number;
  tonnage?: number;
  confidence: number; // prediction confidence
  uncertainty?: number; // uncertainty range
  scenario: 'base' | 'optimistic' | 'pessimistic';
  modelVersion: string; // AI model version
  createdAt: Date;
}
```

## API Documentation

### Campaigns API

#### GET /api/campaigns
Retrieves all campaigns with anomaly and prediction counts.

**Response:**
```json
{
  "campaigns": [
    {
      "id": "campaign_id",
      "name": "Campaign Name",
      "latitude": 32.4,
      "longitude": -101.5,
      "radiusKm": 50,
      "resourceType": "oil",
      "status": "active",
      "_count": {
        "anomalies": 15,
        "predictions": 15
      }
    }
  ]
}
```

#### POST /api/campaigns
Creates a new exploration campaign.

**Request Body:**
```json
{
  "name": "Campaign Name",
  "description": "Campaign description",
  "latitude": 32.4,
  "longitude": -101.5,
  "radiusKm": 50,
  "resourceType": "oil",
  "geologyContext": "basin",
  "createdBy": "user_id"
}
```

### Anomalies API

#### GET /api/anomalies?campaignId={id}
Retrieves anomalies for a specific campaign.

#### POST /api/anomalies
Generates physics-based anomalies for a campaign.

**Request Body:**
```json
{
  "campaignId": "campaign_id",
  "anomalyCount": 15
}
```

**Response:**
```json
{
  "message": "Generated 15 anomalies",
  "anomalies": [
    {
      "id": "anomaly_id",
      "campaignId": "campaign_id",
      "latitude": 32.41,
      "longitude": -101.51,
      "depthM": 2500,
      "probability": 0.87,
      "confidence": 0.92,
      "anomalyType": "gravity",
      "value": -37.5,
      "volumeM3": 450000,
      "resourceEstimate": {
        "estimatedVolume": 450000,
        "confidence": 0.92,
        "methodology": "GeoRNG deterministic physics",
        "modelVersion": "v4.0.0"
      }
    }
  ]
}
```

### Predictions API

#### GET /api/predictions?campaignId={id}
Retrieves predictions for a specific campaign.

#### POST /api/predictions
Generates AI-powered temporal predictions.

**Request Body:**
```json
{
  "campaignId": "campaign_id",
  "timeHorizon": 5
}
```

## Physics Engine (GeoRNG)

The GeoRNG (Geospatial Random Number Generator) ensures deterministic, physics-based anomaly generation:

### Key Features

1. **Deterministic Seeding**: Same coordinates always produce same results
2. **Physics Constraints**: Anomalies respect geological and physical limits
3. **Multi-modal Support**: Gravity, magnetic, thermal, and spectral anomalies
4. **Context Awareness**: Different geological contexts have different characteristics

### Usage Example

```typescript
import { GeoRNG } from '@/lib/physics/georng';

const geoRNG = new GeoRNG(32.4, -101.5, {
  type: 'basin',
  age: 'Mesozoic',
  composition: 'sedimentary'
});

// Generate complete anomaly set
const anomalies = geoRNG.generateAnomalySet(32.41, -101.51, 2500);

// Validate physics consistency
const validation = geoRNG.validateAnomalyConsistency(anomalies);
```

## Real-time Service

The WebSocket service provides live updates and real-time processing:

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('/?XTransformPort=3001');

// Subscribe to campaign updates
socket.emit('subscribe_campaign', 'campaign_id');

// Listen for real-time updates
socket.on('campaign_update', (data) => {
  console.log('New anomaly detected:', data);
});
```

### Events

- `subscribe_campaign` - Subscribe to campaign updates
- `unsubscribe_campaign` - Unsubscribe from campaign updates
- `generate_anomalies` - Request anomaly generation
- `generate_predictions` - Request prediction generation
- `campaign_update` - Real-time anomaly detection
- `system_status` - System health and performance metrics

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- SQLite

### Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd aurora-osi-v4
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   ```bash
   npm run db:push
   ```

4. **Start Development Servers**
   ```bash
   # Main application
   npm run dev
   
   # Real-time service (in separate terminal)
   cd mini-services/realtime-service
   npm run dev
   ```

### Environment Variables

Create `.env.local` file:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### Linting
```bash
npm run lint
```

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## Performance Metrics

### Target Performance
- **Frontend Load Time**: < 3 seconds
- **API Response Time**: < 200ms (95th percentile)
- **Physics Engine Processing**: < 5 seconds for 100km² area
- **AI Prediction Generation**: < 30 seconds for 5-year forecast

### System Requirements
- **Minimum**: 4GB RAM, 2 CPU cores
- **Recommended**: 8GB RAM, 4 CPU cores
- **Storage**: 10GB+ for database and satellite data

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Data encryption at rest and in transit
- Audit logging for all operations

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- TypeScript for all new code
- ESLint compliance required
- 80%+ test coverage
- Conventional commit messages

## License

© 2024 Aurora OSI Defense & Exploration. All rights reserved.

## Support

- Documentation: [Link to docs]
- Issues: [GitHub Issues]
- Contact: support@aurora-osi.com

## Version History

### v4.0.0 (Current)
- Initial release with deterministic physics engine
- AI-powered temporal predictions
- Real-time WebSocket service
- Comprehensive campaign management
- Multi-sensor data integration

### Future Roadmap
- v4.1.0: Enhanced AI models with quantum assistance
- v4.2.0: Mobile application
- v4.3.0: Advanced 3D visualization
- v5.0.0: Full digital twin implementation