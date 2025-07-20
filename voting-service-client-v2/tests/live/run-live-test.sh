#!/bin/bash

# Script to run the live testing suite for digitalwahl.org

# Change to the project root directory
cd "$(dirname "$0")/../.."

# Clean up previous test results
echo "Cleaning up previous test results..."
rm -rf voting-results/*
rm -rf test-results/*

# Create necessary directories if they don't exist
mkdir -p voting-results
mkdir -p test-results

# Run the live test with Playwright
echo "Starting live test with Playwright..."
echo "Connecting to: https://digitalwahl.org"
echo "Event ID: 1007, Organizer: herrmann"
echo ""

# Run the test with the live configuration
npx playwright test tests/live/live-test.spec.js --config=playwright.config.js --workers=4

# Check exit status
if [ $? -eq 0 ]; then
    echo "Live test completed successfully!"
else
    echo "Live test encountered errors. Check the results."
fi

# Display summary information
echo ""
echo "Test results:"
echo "-------------"
echo "Results directory: $(pwd)/voting-results/"
echo "Screenshots directory: $(pwd)/test-results/"
echo ""

# Show user stats if available
if [ -f "voting-results/all-voted-notification.json" ]; then
    echo "Voting statistics:"
    cat voting-results/all-voted-notification.json
    echo ""
fi

echo "Test completed at: $(date)"