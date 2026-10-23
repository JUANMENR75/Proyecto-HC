const fs = require('fs');
const path = require('path');
const environment = process.argv[2];

if (!environment) {
  console.error('Please specify an environment: local or cloud');
  process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const targetEnvPath = path.join(rootDir, '.env');
let sourceEnvPath;

if (environment === 'local') {
  sourceEnvPath = path.join(rootDir, '.env.local');
  console.log('Switching to local database environment...');
} else if (environment === 'cloud') {
  sourceEnvPath = path.join(rootDir, '.env.cloud');
  console.log('Switching to cloud database environment...');
} else {
  console.error('Invalid environment. Please specify "local" or "cloud"');
  process.exit(1);
}

if (!fs.existsSync(sourceEnvPath)) {
  console.error(`Error: ${sourceEnvPath} does not exist`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourceEnvPath, targetEnvPath);
  console.log(`Successfully copied ${sourceEnvPath} to ${targetEnvPath}`);
} catch (error) {
  console.error(`Error copying file: ${error.message}`);
  process.exit(1);
}

console.log(`Environment switched to ${environment}`);