#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

const service = process.argv[2] || 'api';

function checkHealth(service) {
  return new Promise((resolve, reject) => {
    if (service === 'api') {
      // Check API health
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/health',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve('API is healthy');
        } else {
          reject(new Error(`API returned status ${res.statusCode}`));
        }
      });

      req.on('error', (err) => {
        reject(new Error(`API health check failed: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('API health check timeout'));
      });

      req.end();
    } else if (service === 'consumer') {
      // Check if consumer process is running by checking for recent log activity
      try {
        const logPath = '/app/logs/consumer.log';
        if (fs.existsSync(logPath)) {
          const stats = fs.statSync(logPath);
          const now = new Date();
          const mtime = new Date(stats.mtime);
          const diffMinutes = (now - mtime) / (1000 * 60);
          
          if (diffMinutes < 10) {
            resolve('Consumer is healthy');
          } else {
            reject(new Error('Consumer log is too old'));
          }
        } else {
          // If log doesn't exist, assume it's starting up
          resolve('Consumer is starting');
        }
      } catch (error) {
        reject(new Error(`Consumer health check failed: ${error.message}`));
      }
    } else {
      reject(new Error(`Unknown service: ${service}`));
    }
  });
}

checkHealth(service)
  .then((message) => {
    console.log(message);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });