# Aurora OSI v4.0 - Technical Architecture

## System Overview

Aurora OSI v4.0 is a comprehensive subsurface intelligence platform that combines deterministic physics modeling, artificial intelligence, and real-time data processing to provide predictive insights for resource exploration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Dashboard     │  │   Map View      │  │   Predictions   │ │
│  │   Management    │  │   Visualization │  │   Interface     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Campaigns    │  │   Anomalies    │  │   Predictions   │ │
│  │     API        │  │     API        │  │      API        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   GeoRNG       │  │   AI Engine     │  │   Validation    │ │
│  │   Physics      │  │   Predictions   │  │   Agents       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   SQLite        │  │   Cache         │  │   File Storage  │ │
│  │   Database      │  │   Layer         │  │   (Assets)      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 External Services                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Satellite     │  │   Weather       │  │   AI/ML         │ │
│  │   APIs         │  │   Services      │  │   Services      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Application (Next.js 15)

**Technology Stack:**
- React 19 with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Lucide React for icons
- TanStack Query for data fetching
- Zustand for state management

**Key Features:**
- Responsive design with mobile-first approach
- Real-time updates via WebSocket
- Interactive map visualization
- Campaign management interface
- Anomaly detection dashboard
- Temporal prediction views

**Component Structure:**
```
src/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── layout.tsx                  # App layout
│   └── api/                       # API routes
├── components/
│   ├── ui/                        # Base UI components
│   └── dashboard/                 # Dashboard-specific components
│       ├── MapView.tsx
│       ├── PredictionView.tsx
│       └── AnomalyPanel.tsx
├── lib/
│   ├── physics/                   # Physics engine
│   ├── db.ts                      # Database client
│   └── utils.ts                   # Utility functions
└── hooks/                         # Custom React hooks
```

### 2. API Layer (Next.js API Routes)

**Design Principles:**
- RESTful API design
- Type-safe request/response handling
- Comprehensive error handling
- Input validation and sanitization
- Rate limiting and security

**Key Endpoints:**

#### Campaign Management
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign

#### Anomaly Processing
- `GET /api/anomalies` - Get anomalies for campaign
- `POST /api/anomalies` - Generate new anomalies
- `GET /api/anomalies/[id]` - Get anomaly details
- `PUT /api/anomalies/[id]` - Update anomaly validation

#### Prediction Engine
- `GET /api/predictions` - Get predictions for campaign
- `POST /api/predictions` - Generate AI predictions
- `GET /api/predictions/[id]` - Get prediction details

### 3. Physics Engine (GeoRNG)

**Core Principles:**
- Deterministic behavior based on geographic coordinates
- Physics-constrained anomaly generation
- Multi-modal sensor simulation
- Geological context awareness

**Key Classes:**

```typescript
class GeoRNG {
  // Deterministic random number generation
  private deterministicRandom(): number
  
  // Multi-modal anomaly generation
  public generateGravityAnomaly(): AnomalyResult
  public generateMagneticAnomaly(): AnomalyResult
  public generateThermalAnomaly(): AnomalyResult
  public generateSpectralAnomaly(): AnomalyResult
  
  // Physics validation
  public validateAnomalyConsistency(): ValidationResult
}
```

**Physics Constraints:**
- Gravity anomalies: -60 to -20 mGal
- Magnetic anomalies: 48,000 to 68,000 nT
- Thermal anomalies: 5°C to 35°C
- Depth constraints: 100m to 12,000m
- Gradient limits: 20-80 units/km

### 4. AI Prediction Engine

**Integration with Z-AI SDK:**
- Large language model for temporal forecasting
- Physics-informed neural networks
- Uncertainty quantification
- Multi-scenario modeling

**Prediction Pipeline:**
1. Data preprocessing and feature extraction
2. Historical trend analysis
3. Physics constraint application
4. AI model inference
5. Uncertainty calculation
6. Scenario generation (base/optimistic/pessimistic)

### 5. Real-time Service (Socket.IO)

**Features:**
- WebSocket-based real-time communication
- Campaign subscription management
- Live anomaly detection
- System status broadcasting
- Connection health monitoring

**Event System:**
```typescript
// Client events
socket.emit('subscribe_campaign', campaignId)
socket.emit('generate_anomalies', { campaignId, count })

// Server events
socket.on('campaign_update', handleUpdate)
socket.on('system_status', handleStatus)
socket.on('anomalies_generated', handleAnomalies)
```

## Data Flow Architecture

### Campaign Creation Flow
```
User Input → Frontend Validation → API Request → Database Storage → Real-time Broadcast
```

### Anomaly Generation Flow
```
Campaign Selection → GeoRNG Initialization → Physics Simulation → Anomaly Creation → Database Storage → Client Update
```

### AI Prediction Flow
```
Historical Data → Feature Extraction → AI Model Inference → Physics Validation → Multi-scenario Generation → Storage → Visualization
```

## Database Design

### Schema Overview
- **Users**: Authentication and authorization
- **Campaigns**: Exploration campaign management
- **Anomalies**: Detected subsurface anomalies
- **Predictions**: AI-generated temporal forecasts
- **Reports**: Automated technical reports
- **SensorData**: Raw satellite and sensor data
- **DigitalTwins**: 5D voxel models

### Relationships
- Users → Campaigns (1:N)
- Campaigns → Anomalies (1:N)
- Campaigns → Predictions (1:N)
- Campaigns → Reports (1:N)
- Campaigns → DigitalTwins (1:1)

### Indexing Strategy
- Spatial indexing for coordinate queries
- Composite indexes for campaign-based queries
- Time-based indexes for temporal queries
- Full-text search for report content

## Security Architecture

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key management for external services
- Session management with refresh tokens

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### API Security
- Rate limiting per user/IP
- CORS configuration
- Request size limits
- API versioning
- Audit logging

## Performance Optimization

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization and CDN usage
- Caching strategies (browser, service worker)
- Bundle size optimization
- Critical CSS inlining

### Backend Optimization
- Database query optimization
- Connection pooling
- Response caching
- Background job processing
- Horizontal scaling support

### Real-time Performance
- Connection pooling for WebSocket
- Message batching for high-frequency updates
- Load balancing for multiple service instances
- Automatic failover mechanisms

## Monitoring & Observability

### Application Metrics
- Response times and error rates
- Database query performance
- Real-time connection counts
- AI model inference times
- System resource utilization

### Logging Strategy
- Structured logging with correlation IDs
- Log levels (DEBUG, INFO, WARN, ERROR)
- Centralized log aggregation
- Security event logging
- Performance tracing

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service availability
- Real-time service monitoring
- Automated alerting

## Deployment Architecture

### Container Strategy
- Multi-stage Docker builds
- Environment-specific configurations
- Health check implementations
- Graceful shutdown handling
- Resource limits and monitoring

### Infrastructure Components
- Load balancer for API distribution
- Application servers (auto-scaling)
- Database cluster with replication
- Redis cluster for caching
- File storage for static assets

### CI/CD Pipeline
- Automated testing on every commit
- Security scanning and vulnerability checks
- Staged deployments (dev → staging → prod)
- Rollback capabilities
- Performance testing integration

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Session externalization
- Database read replicas
- Microservice decomposition
- Event-driven architecture

### Data Scaling
- Database sharding strategies
- Time-series data partitioning
- Archive policies for historical data
- Data compression techniques
- Distributed file storage

### Geographic Distribution
- CDN for static content
- Multi-region deployment
- Data locality considerations
- Cross-region replication
- Latency optimization

## Future Architecture Evolution

### Microservices Transition
- Campaign service decomposition
- Anomaly processing service
- Prediction engine service
- User management service
- Notification service

### Advanced AI Integration
- Quantum computing integration
- Federated learning capabilities
- Real-time model training
- Explainable AI features
- Automated model retraining

### Edge Computing
- On-premises processing capabilities
- Edge analytics for real-time decisions
- Offline functionality support
- Data synchronization strategies
- Hybrid cloud deployment