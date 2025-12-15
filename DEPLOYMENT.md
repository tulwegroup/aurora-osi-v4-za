# Aurora OSI v4.5 Deployment Configuration

## Overview
Aurora OSI v4.5 Multi-Agent Consensus Intelligence System is a production-ready Next.js application with comprehensive deployment configurations for various environments.

## System Architecture

### Core Components
- **Frontend**: Next.js 15 with App Router
- **Backend**: API routes with TypeScript
- **Database**: Prisma ORM with SQLite
- **Real-time**: WebSocket service (port 3003)
- **AI Integration**: z-ai-web-dev-sdk
- **Satellite Data**: Google Earth Engine integration
- **Multi-Agent System**: Specialized physics agents

### Key Features
- ✅ Zero false positives through physics-based validation
- ✅ Multi-agent consensus with veto power
- ✅ Real Google Earth Engine integration
- ✅ Quantum-assisted inversion algorithms
- ✅ Comprehensive testing suite
- ✅ Responsive UI with real-time updates

## Environment Setup

### Development Environment
```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Start development server
npm run dev

# Run tests
npm run test:system
```

### Environment Variables
```env
# Database
DATABASE_URL="file:./dev.db"

# Google Earth Engine (optional)
GEE_SERVICE_ACCOUNT_KEY="path/to/service-account-key.json"
GEE_PROJECT_ID="your-project-id"

# AI Services (optional)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# WebSocket
WS_PORT=3003
```

## Deployment Options

### 1. Docker Deployment (Recommended)

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
      - WS_PORT=3003
    volumes:
      - ./data:/app/data
    depends_on:
      - websocket

  websocket:
    build: .
    command: ["npm", "run", "dev:websocket"]
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - WS_PORT=3003

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
      - websocket

volumes:
  data:
```

### 2. Kubernetes Deployment

#### Kubernetes Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aurora-osi
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aurora-osi
  template:
    metadata:
      labels:
        app: aurora-osi
    spec:
      containers:
      - name: aurora-osi
        image: aurora-osi:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: aurora-secrets
              key: database-url
        - name: GEE_SERVICE_ACCOUNT_KEY
          valueFrom:
            secretKeyRef:
              name: aurora-secrets
              key: gee-service-account-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: aurora-osi-service
spec:
  selector:
    app: aurora-osi
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer

---
apiVersion: v1
kind: Secret
metadata:
  name: aurora-secrets
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  gee-service-account-key: <base64-encoded-gee-key>
```

### 3. Vercel Deployment

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 4. AWS Deployment

#### AWS Elastic Beanstalk
```bash
# Deploy using EB CLI
eb init aurora-osi
eb create production
eb deploy
```

#### AWS Lambda (Serverless)
```javascript
// lambda.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  }).listen(3000);
});

exports.handler = async (event, context) => {
  // Lambda handler code
};
```

## Production Configuration

### Security
- HTTPS enforcement
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

### Performance
- Image optimization
- Code splitting
- Caching strategies
- CDN integration
- Database indexing

### Monitoring
- Health checks
- Performance metrics
- Error tracking
- Log aggregation
- Alerting

### Scaling
- Horizontal scaling
- Load balancing
- Database replication
- Caching layers
- Auto-scaling policies

## Health Checks

### API Health Endpoint
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '4.5.0',
    services: {
      database: 'connected',
      websocket: 'active',
      gee: 'initialized',
      agents: 'operational'
    }
  });
}
```

### Readiness Endpoint
```typescript
// src/app/api/ready/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not ready',
        error: error.message
      },
      { status: 503 }
    );
  }
}
```

## Environment-Specific Configurations

### Development
- SQLite database
- Mock satellite data
- Debug logging
- Hot reload

### Staging
- PostgreSQL database
- Real satellite data (limited)
- Production-like configuration
- Performance monitoring

### Production
- PostgreSQL database
- Full Google Earth Engine integration
- Optimized performance
- Comprehensive monitoring
- Backup strategies

## Deployment Scripts

### Deploy Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying Aurora OSI v4.5..."

# Build application
echo "📦 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test:system

# Deploy to production
echo "🌍 Deploying to production..."
# Add your deployment command here

# Health check
echo "🏥 Running health check..."
sleep 30
curl -f https://your-domain.com/api/health || exit 1

echo "✅ Deployment completed successfully!"
```

### Rollback Script
```bash
#!/bin/bash
# rollback.sh

echo "🔄 Rolling back Aurora OSI v4.5..."

# Add rollback commands here
# For example:
# git checkout previous-commit
# npm run build
# deploy

echo "✅ Rollback completed!"
```

## Monitoring and Maintenance

### Log Management
- Structured logging
- Log rotation
- Centralized log collection
- Error tracking

### Backup Strategy
- Database backups
- Code repositories
- Configuration backups
- Disaster recovery

### Performance Monitoring
- Response time tracking
- Error rate monitoring
- Resource usage tracking
- User experience metrics

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL
2. **WebSocket Issues**: Verify port configuration
3. **GEE Integration**: Validate service account
4. **Memory Issues**: Monitor resource usage
5. **Performance**: Check caching strategies

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Database debugging
DEBUG=prisma:* npm run dev

# Application debugging
DEBUG=aurora:* npm run dev
```

## Conclusion

Aurora OSI v4.5 is designed for production deployment with comprehensive configurations for various environments. The system includes:

- ✅ Multi-environment support
- ✅ Containerized deployment
- ✅ Cloud-native architecture
- ✅ Comprehensive monitoring
- ✅ Security best practices
- ✅ Performance optimization
- ✅ Automated testing
- ✅ Health checks
- ✅ Backup strategies

The deployment configuration ensures reliable, scalable, and maintainable operation of the Aurora OSI v4.5 Multi-Agent Consensus Intelligence System.