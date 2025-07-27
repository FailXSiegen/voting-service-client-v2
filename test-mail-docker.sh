#!/bin/bash

# Test email configuration in Docker container

echo "=== Testing Email Configuration in Docker Container ==="
echo ""

# Find the API container
CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "voting_api|voting-api" | head -1)

if [ -z "$CONTAINER" ]; then
    echo "❌ No voting API container found!"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo "✅ Found API container: $CONTAINER"
echo ""

# Check if email address is provided
if [ -z "$1" ]; then
    echo "Usage: ./test-mail-docker.sh <recipient-email>"
    echo ""
    echo "Checking environment variables in container..."
    docker exec $CONTAINER sh -c 'env | grep MAIL | sort'
    echo ""
    echo "Please provide an email address to send test email."
    exit 1
fi

EMAIL="$1"
echo "📧 Sending test email to: $EMAIL"
echo ""

# Run the test inside the container
docker exec -it $CONTAINER node bin/test-mail.js "$EMAIL"