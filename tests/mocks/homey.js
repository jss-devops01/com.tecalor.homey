// Mock Homey module for testing
const { EventEmitter } = require('events');

class MockDevice extends EventEmitter {
  constructor() {
    super();
    this.capabilities = new Set();
    this.capabilityValues = new Map();
    this.settings = new Map();
    this.available = true;
  }

  log(...args) {
    console.log('[MOCK DEVICE]', ...args);
  }

  error(...args) {
    console.error('[MOCK DEVICE ERROR]', ...args);
  }

  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  async addCapability(capability) {
    this.capabilities.add(capability);
  }

  async removeCapability(capability) {
    this.capabilities.delete(capability);
    this.capabilityValues.delete(capability);
  }

  async setCapabilityValue(capability, value) {
    if (!this.capabilities.has(capability)) {
      throw new Error(`Capability ${capability} not found`);
    }
    this.capabilityValues.set(capability, value);
    this.emit('capability', capability, value);
  }

  getCapabilityValue(capability) {
    return this.capabilityValues.get(capability);
  }

  registerCapabilityListener(capability, listener) {
    this.on(`capability.${capability}`, listener);
  }

  async setSettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
      this.settings.set(key, value);
    });
  }

  getSettings() {
    return Object.fromEntries(this.settings);
  }

  getSetting(key) {
    return this.settings.get(key);
  }

  async setAvailable() {
    this.available = true;
  }

  async setUnavailable(reason) {
    this.available = false;
  }

  isAvailable() {
    return this.available;
  }

  getData() {
    return { id: 'mock-device' };
  }
}

class MockDriver extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
  }

  log(...args) {
    console.log('[MOCK DRIVER]', ...args);
  }

  error(...args) {
    console.error('[MOCK DRIVER ERROR]', ...args);
  }

  getDevices() {
    return Array.from(this.devices.values());
  }

  getDevice(data) {
    return this.devices.get(data.id);
  }
}

class MockApp extends EventEmitter {
  constructor() {
    super();
  }

  log(...args) {
    console.log('[MOCK APP]', ...args);
  }

  error(...args) {
    console.error('[MOCK APP ERROR]', ...args);
  }
}

module.exports = {
  Device: MockDevice,
  Driver: MockDriver,
  App: MockApp
};
