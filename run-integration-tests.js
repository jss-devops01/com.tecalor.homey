#!/usr/bin/env node
/**
 * Integration Test Runner for ESPHome
 * 
 * This script helps run integration tests against a real ESP32 device.
 * 
 * Usage:
 *   node run-integration-tests.js
 *   node run-integration-tests.js --device-ip=192.168.1.100 --encryption-key=your-key
 *   node run-integration-tests.js --quick
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--device-ip=')) {
    options.deviceIp = arg.split('=')[1];
  } else if (arg.startsWith('--encryption-key=')) {
    options.encryptionKey = arg.split('=')[1];
  } else if (arg === '--quick') {
    options.quick = true;
  } else if (arg === '--skip') {
    options.skip = true;
  }
});

// Default configuration
const config = {
  deviceIp: options.deviceIp || '192.168.200.80',
  port: '6053',
  encryptionKey: options.encryptionKey || 'Quvqw/PaxsHQ90BGdFN1jgDJ8iGgX2QfGVdvZttBemA=',
  skip: options.skip || false,
  quick: options.quick || false
};

console.log('🚀 ESPHome Integration Test Runner');
console.log('=====================================');
console.log(`Device IP: ${config.deviceIp}`);
console.log(`Port: ${config.port}`);
console.log(`Encryption Key: ${config.encryptionKey.substring(0, 10)}...`);
console.log(`Quick Mode: ${config.quick}`);
console.log(`Skip Tests: ${config.skip}`);
console.log('');

// Set environment variables
const env = {
  ...process.env,
  SKIP_INTEGRATION_TESTS: config.skip ? 'true' : 'false',
  TEST_DEVICE_IP: config.deviceIp,
  TEST_DEVICE_PORT: config.port,
  TEST_ENCRYPTION_KEY: config.encryptionKey
};

// Build jest command
let jestArgs = [];
if (config.quick) {
  jestArgs.push('--testNamePattern=Quick Integration Test');
} else {
  jestArgs.push('--testPathPattern=integration');
}

jestArgs.push('--verbose');
jestArgs.push('--detectOpenHandles');

console.log('Running command:', 'npm', 'test', '--', ...jestArgs);
console.log('');

// Run the tests
const child = spawn('npm', ['test', '--', ...jestArgs], {
  cwd: path.dirname(__filename),
  env: env,
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log('');
  if (code === 0) {
    console.log('✅ Integration tests completed successfully!');
  } else {
    console.log('❌ Integration tests failed.');
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Ensure your ESP32 device is powered on and connected to the network');
    console.log('2. Verify the IP address is correct');
    console.log('3. Check that the encryption key matches your ESPHome configuration');
    console.log('4. Make sure the ESPHome API is enabled on your device');
    console.log('');
    console.log('To skip integration tests: node run-integration-tests.js --skip');
    console.log('To run only quick test: node run-integration-tests.js --quick');
  }
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Failed to start integration tests:', error);
  process.exit(1);
});
