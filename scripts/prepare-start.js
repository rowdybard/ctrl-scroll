#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Log current directory
console.log('Current directory:', process.cwd());

// Check if we're in the root directory
const webAppPath = path.join(process.cwd(), 'apps', 'web');
const nextBuildPath = path.join(webAppPath, '.next');

console.log('Checking for .next directory at:', nextBuildPath);

if (fs.existsSync(nextBuildPath)) {
  console.log('✅ Found .next directory');
  
  // Change to web app directory and start Next.js
  process.chdir(webAppPath);
  console.log('Changed directory to:', process.cwd());
  
  // Start Next.js
  require('next/dist/cli/next-start');
} else {
  console.error('❌ Could not find .next directory at:', nextBuildPath);
  console.error('Available directories:', fs.readdirSync(process.cwd()));
  process.exit(1);
}
