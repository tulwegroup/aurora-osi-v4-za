#!/bin/bash

# Aurora OSI v4.5 Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Aurora OSI v4.5"
VERSION="4.5.0"
ENVIRONMENT=${1:-development}
BACKUP_DIR="./backups"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    if [[ "$ENVIRONMENT" == "production" ]] && ! command -v docker &> /dev/null; then
        log_error "Docker is required for production deployment"
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

# Create backup of current deployment
create_backup() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Creating backup of current deployment..."
        
        mkdir -p $BACKUP_DIR
        
        # Backup database
        if [[ -f "./db/prod.db" ]]; then
            cp "./db/prod.db" "$BACKUP_DIR/prod.db.$(date +%Y%m%d_%H%M%S)"
            log_success "Database backup created"
        fi
        
        # Backup configuration
        cp -r "./src" "$BACKUP_DIR/src.$(date +%Y%m%d_%H%M%S)"
        log_success "Source code backup created"
    fi
}

# Run tests before deployment
run_tests() {
    log_info "Running tests..."
    
    # Run system tests
    if node src/tests/run-system-tests.js; then
        log_success "All tests passed"
    else
        log_error "Tests failed. Deployment aborted."
        exit 1
    fi
}

# Build application
build_app() {
    log_info "Building application..."
    
    # Clean previous build
    rm -rf .next
    
    # Install dependencies
    npm ci
    
    # Build application
    npm run build
    
    log_success "Application built successfully"
}

# Deploy to development
deploy_development() {
    log_info "Deploying to development environment..."
    
    # Stop existing processes
    pkill -f "next-server" || true
    pkill -f "node.*websocket" || true
    
    # Start development server
    npm run dev &
    
    log_success "Development deployment completed"
}

# Deploy to staging
deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Build and run with Docker
    docker-compose -f docker-compose.staging.yml up -d --build
    
    # Wait for health check
    sleep 30
    
    # Verify deployment
    if curl -f http://localhost:3001/api/health; then
        log_success "Staging deployment completed successfully"
    else
        log_error "Staging deployment failed health check"
        exit 1
    fi
}

# Deploy to production
deploy_production() {
    log_info "Deploying to production environment..."
    
    # Create backup
    create_backup
    
    # Run tests
    run_tests
    
    # Build application
    build_app
    
    # Deploy with Docker
    docker-compose down
    docker-compose up -d --build
    
    # Wait for health check
    log_info "Waiting for application to start..."
    sleep 60
    
    # Verify deployment
    if curl -f http://localhost:3000/api/health; then
        log_success "Production deployment completed successfully"
        
        # Clean up old containers
        docker system prune -f
        
    else
        log_error "Production deployment failed health check"
        log_info "Rolling back..."
        
        # Rollback
        docker-compose down
        # Add rollback logic here
        
        exit 1
    fi
}

# Rollback deployment
rollback() {
    log_info "Rolling back deployment..."
    
    # Stop current deployment
    docker-compose down
    
    # Restore from backup
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/prod.db.* | head -1)
    if [[ -n "$LATEST_BACKUP" ]]; then
        cp "$LATEST_BACKUP" "./db/prod.db"
        log_success "Database restored from backup"
    fi
    
    # Restart with previous version
    docker-compose up -d
    
    log_success "Rollback completed"
}

# Show deployment status
show_status() {
    log_info "Deployment status:"
    
    # Check if application is running
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        log_success "Application is running and healthy"
        
        # Show health details
        curl -s http://localhost:3000/api/health | jq '.'
    else
        log_warning "Application is not running or unhealthy"
    fi
    
    # Show Docker containers
    if command -v docker &> /dev/null; then
        log_info "Docker containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
}

# Main deployment logic
main() {
    echo "🚀 $APP_NAME Deployment Script"
    echo "=================================="
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo ""
    
    case $ENVIRONMENT in
        "development")
            check_dependencies
            deploy_development
            ;;
        "staging")
            check_dependencies
            deploy_staging
            ;;
        "production")
            check_dependencies
            deploy_production
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        *)
            echo "Usage: $0 {development|staging|production|rollback|status}"
            echo ""
            echo "Environments:"
            echo "  development - Deploy to development environment"
            echo "  staging     - Deploy to staging environment"
            echo "  production  - Deploy to production environment"
            echo "  rollback    - Rollback to previous version"
            echo "  status      - Show deployment status"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "Deployment process completed!"
}

# Handle script interruption
trap 'log_warning "Deployment interrupted"; exit 1' INT

# Run main function
main "$@"