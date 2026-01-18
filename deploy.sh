#!/bin/bash
set -e

echo "Starting Alili deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

# Load environment
source .env

# Validate required variables
if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
    echo "Error: Please set DOMAIN in .env file"
    exit 1
fi

echo "Deploying to domain: $DOMAIN"

# Build and start containers
echo "Building containers..."
docker compose build

echo "Starting containers..."
docker compose up -d

echo ""
echo "Deployment complete!"
echo "Your application should be available at https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f        # View all logs"
echo "  docker compose logs -f caddy  # View Caddy logs (SSL status)"
echo "  docker compose ps             # View container status"
echo "  docker compose down            # Stop all containers"
