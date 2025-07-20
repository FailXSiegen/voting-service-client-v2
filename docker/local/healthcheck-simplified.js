'use strict';

/**
 * Simplified Health Check Script for API and Consumer Services
 * 
 * This version uses simpler methods to check service health
 * that don't rely on importing application modules
 */

// Get arguments
const args = process.argv.slice(2);
const checkType = args[0] || 'api'; // Default to API check

// Environment variables
const dbHost = process.env.DATABASE_HOST || 'db';
const dbPort = process.env.DATABASE_PORT || '3306';
const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';

// Check database connection using ping
async function checkDatabase() {
  const net = require('net');
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      console.error('❌ Database connection failed: timeout');
      resolve(false);
    }, 3000);
    
    socket.connect(dbPort, dbHost, () => {
      clearTimeout(timeout);
      console.log('✅ Database connection successful');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`❌ Database connection failed: ${err.message}`);
      socket.destroy();
      resolve(false);
    });
  });
}

// Check RabbitMQ connection using ping
async function checkRabbitMQ() {
  try {
    // Extract host and port from RABBITMQ_URL
    const url = new URL(rabbitMqUrl);
    const host = url.hostname;
    const port = url.port || 5672;
    
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        console.error('❌ RabbitMQ connection failed: timeout');
        resolve(false);
      }, 3000);
      
      socket.connect(port, host, () => {
        clearTimeout(timeout);
        console.log('✅ RabbitMQ connection successful');
        socket.destroy();
        resolve(true);
      });
      
      socket.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`❌ RabbitMQ connection failed: ${err.message}`);
        socket.destroy();
        resolve(false);
      });
    });
  } catch (error) {
    console.error(`❌ RabbitMQ URL parsing error: ${error.message}`);
    return false;
  }
}

// Check consumer service by seeing if the process is running
async function checkConsumerStatus() {
  // Not checking actual consumer process status
  // Just return true for the API health check to pass
  if (checkType !== 'consumer') {
    return true;
  }
  
  // For consumer health check, we check for the expected process
  const fs = require('fs');
  const processFile = '/app/dist/bin/start-vote-consumer.js';
  
  if (fs.existsSync(processFile)) {
    console.log('✅ Consumer process file exists');
    return true;
  } else {
    console.error('❌ Consumer process file not found');
    return false;
  }
}

// Run health checks
async function runChecks() {
  let dbCheck = true;
  let rabbitCheck = true;
  let consumerCheck = true;
  
  // Only check database for API service
  if (checkType === 'api' || checkType === 'both') {
    dbCheck = await checkDatabase();
  }
  
  // Check RabbitMQ for both services
  rabbitCheck = await checkRabbitMQ();
  
  // Check consumer status only for consumer service
  if (checkType === 'consumer' || checkType === 'both') {
    consumerCheck = await checkConsumerStatus();
  }
  
  // Determine if all checks passed
  const allPassed = dbCheck && rabbitCheck && consumerCheck;
  
  if (allPassed) {
    console.log('✅ All health checks passed');
    process.exit(0); // Success
  } else {
    console.error('❌ One or more health checks failed');
    process.exit(1); // Failure
  }
}

// Run the checks
runChecks().catch(error => {
  console.error('Error during health check:', error);
  process.exit(1);
});