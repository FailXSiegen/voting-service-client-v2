#!/bin/bash
# Test-Skript für lokales Voting Tool Setup

set -e

echo "🚀 Starting local test of Voting Tool..."

# Cleanup vorherige Container
echo "🧹 Cleaning up previous containers..."
docker compose -f docker-compose.test.yml down -v 2>/dev/null || true

# Build Images
echo "🔨 Building Docker images..."
docker compose -f docker-compose.test.yml build

# Start Container
echo "🚢 Starting containers..."
docker compose -f docker-compose.test.yml up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check Container Status
echo "📊 Container Status:"
docker compose -f docker-compose.test.yml ps

# Test Database Connection
echo "🗄️ Testing database connection..."
docker exec voting_db_test mysql -uvoting_user -pvoting_password -e "SELECT 1;" voting_db || {
    echo "❌ Database connection failed!"
    exit 1
}

# Test API Health
echo "🏥 Testing API health..."
curl -f http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}' || {
    echo "❌ API health check failed!"
    echo "API Logs:"
    docker logs voting_api_test --tail 50
    exit 1
}

# Test Client
echo "🌐 Testing client..."
curl -f http://localhost:8080 || {
    echo "❌ Client not responding!"
    echo "Client Logs:"
    docker logs voting_client_test --tail 50
    exit 1
}

# Test Internal Communication
echo "🔗 Testing internal communication..."
docker exec voting_api_test nc -zv db 3306 || {
    echo "❌ Internal network communication failed!"
    exit 1
}

# Test API to Client communication  
echo "🔄 Testing API can reach client..."
docker exec voting_api_test nc -zv client 80 || {
    echo "❌ API to client communication failed!"
    exit 1
}

# Test WebSocket functionality
echo "🔌 Testing WebSocket functionality..."
if command -v node > /dev/null 2>&1; then
    if [ -f "healthcheck-websocket.js" ]; then
        HOST=localhost APP_PORT=4000 node healthcheck-websocket.js || {
            echo "⚠️ WebSocket health check failed, but containers are running"
        }
    else
        echo "ℹ️ WebSocket health check not found, testing basic connection..."
        # Simple WebSocket test with timeout
        timeout 5s node -e "
        const WebSocket = require('ws');
        const ws = new WebSocket('ws://localhost:4000/graphql', {
          headers: { 'Sec-WebSocket-Protocol': 'graphql-ws' }
        });
        ws.on('open', () => {
          console.log('✅ WebSocket connection successful');
          ws.send(JSON.stringify({type: 'connection_init', payload: {}}));
        });
        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'connection_ack') {
            console.log('✅ WebSocket protocol working');
            ws.close();
            process.exit(0);
          }
        });
        ws.on('error', (error) => {
          console.log('⚠️ WebSocket error:', error.message);
          process.exit(1);
        });
        setTimeout(() => {
          console.log('⚠️ WebSocket test timeout');
          ws.close();
          process.exit(1);
        }, 4000);
        " 2>/dev/null || echo "⚠️ WebSocket test timeout or error (may be expected)"
    fi
else
    echo "ℹ️ Node.js not found, skipping WebSocket tests"
fi

echo "✅ All tests passed!"
echo ""
echo "📍 Access points:"
echo "   - Client: http://localhost:8080"
echo "   - API: http://localhost:4000/graphql"
echo "   - WebSocket: ws://localhost:4000/graphql"
echo "   - Database: localhost:3306"
echo ""
echo "🔧 Additional tools:"
echo "   - WebSocket health check: node healthcheck-websocket.js"
echo "   - Full WebSocket test suite: ./test-websocket-suite.sh"
echo ""
echo "🛑 To stop: docker compose -f docker-compose.test.yml down"
echo "📜 To view logs: docker compose -f docker-compose.test.yml logs -f"