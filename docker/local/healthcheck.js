'use strict';

/**
 * Health Check Script for API and Consumer Services
 *
 * This script provides endpoints that can be used for Docker health checks.
 * - For API: Checks the database connection and RabbitMQ connection
 * - For Consumer: Checks the RabbitMQ connection and consumer status
 */

// Set default environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Essential checks
let checks = {
  database: false,
  rabbitmq: false,
  consumer: false
};

// Command line arguments
const args = process.argv.slice(2);
const checkType = args[0] || 'api'; // Default to API check

// Only perform relevant checks based on service type
if (checkType === 'api') {
  checks.consumer = true; // API doesn't need consumer check
} else if (checkType === 'consumer') {
  // Consumer doesn't need direct database check
}

// Check database connection
async function checkDatabase() {
  try {
    // Dynamically import database to avoid full application initialization
    // Use absolute path for container environment
    const db = require('/app/src/lib/database');
    
    // Simple query to check connection
    const result = await db.query('SELECT 1 as check');
    
    if (Array.isArray(result) && result.length > 0 && result[0].check === 1) {
      console.log('✅ Database connection successful');
      checks.database = true;
    } else {
      console.error('❌ Database connection failed: Unexpected result format');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Check RabbitMQ connection
async function checkRabbitMQ() {
  try {
    const amqp = require('amqplib');
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';
    
    // Try to connect
    const connection = await amqp.connect(url);
    
    // Create a channel to verify deeper connectivity
    const channel = await connection.createChannel();
    
    // Close resources
    await channel.close();
    await connection.close();
    
    console.log('✅ RabbitMQ connection successful');
    checks.rabbitmq = true;
  } catch (error) {
    console.error('❌ RabbitMQ connection failed:', error.message);
  }
}

// Check consumer status (only for consumer service)
async function checkConsumerStatus() {
  try {
    if (checkType !== 'consumer') {
      checks.consumer = true;
      return;
    }
    
    // For consumer check, we verify if the consumer service file exists and is loaded
    const fs = require('fs');
    const consumerPath = '/app/src/services/vote-consumer.js';
    
    if (fs.existsSync(consumerPath)) {
      try {
        const consumer = require(consumerPath);
        
        if (consumer && typeof consumer.isRunning === 'boolean') {
          if (consumer.isRunning) {
            console.log('✅ Vote consumer service is running');
            checks.consumer = true;
          } else {
            console.error('❌ Vote consumer service is not running');
          }
        } else {
          console.error('❌ Vote consumer service does not have expected interface');
        }
      } catch (requireError) {
        console.error('❌ Error requiring consumer service:', requireError.message);
      }
    } else {
      console.error('❌ Vote consumer service module not found at', consumerPath);
    }
  } catch (error) {
    console.error('❌ Error checking consumer status:', error.message);
  }
}

// Run checks and exit with appropriate code
async function runChecks() {
  if (checkType === 'api' || checkType === 'both') {
    await checkDatabase();
  }
  
  if (checkType === 'api' || checkType === 'consumer' || checkType === 'both') {
    await checkRabbitMQ();
  }
  
  if (checkType === 'consumer' || checkType === 'both') {
    await checkConsumerStatus();
  }
  
  // Determine exit code based on checks
  const relevantChecks = Object.values(checks).filter(val => val !== null);
  const allPassed = relevantChecks.every(val => val === true);
  
  if (allPassed) {
    console.log('✅ All health checks passed');
    process.exit(0);
  } else {
    console.error('❌ One or more health checks failed');
    process.exit(1);
  }
}

// Run the checks
runChecks().catch(error => {
  console.error('Error during health check:', error);
  process.exit(1);
});