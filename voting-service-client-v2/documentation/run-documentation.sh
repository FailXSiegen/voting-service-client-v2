#!/bin/bash

# Run script for Organizer Documentation
# This script helps with generating and compiling the documentation

# Create directories if they don't exist
mkdir -p screenshots
mkdir -p docs

# Step 1: Run the Playwright tests to generate screenshots and markdown files
echo "Running Playwright tests to generate documentation..."
npx playwright test simple-doc.spec.js

# Step 2: Compile the documentation into a single file
echo "Compiling documentation..."

# First, copy the base documentation file
cp organizer-documentation.md docs/complete-documentation.md

# Then append all the individual markdown files in order
for file in screenshots/*.md; do
  if [ -f "$file" ]; then
    echo "" >> docs/complete-documentation.md
    echo "## $(basename "$file" .md)" >> docs/complete-documentation.md
    echo "" >> docs/complete-documentation.md
    cat "$file" >> docs/complete-documentation.md
    echo "" >> docs/complete-documentation.md
  fi
done

# Step 3: Update image paths in the complete documentation
echo "Updating image paths..."
sed -i 's|*Screenshot: \([^*]*\).png*|![Screenshot: \1](../screenshots/\1.png)|g' docs/complete-documentation.md

echo "Documentation generated successfully!"
echo "Complete documentation is available at: docs/complete-documentation.md"
echo "Screenshots are available in the screenshots directory"