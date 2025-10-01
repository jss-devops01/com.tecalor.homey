// Test setup file
import { EventEmitter } from 'events';

// Mock Homey API
const mockHomey = {
  Device: class MockDevice extends EventEmitter {
    private capabilities = new Set<string>();
    private capabilityValues = new Map<string, any>();
    private settings = new Map<string, any>();
    private available = true;

    constructor() {
      super();
    }

    log(...args: any[]) {
      console.log('[MOCK DEVICE]', ...args);
    }

    error(...args: any[]) {
      console.error('[MOCK DEVICE ERROR]', ...args);
    }

    hasCapability(capability: string): boolean {
      return this.capabilities.has(capability);
    }

    addCapability(capability: string): Promise<void> {
      this.capabilities.add(capability);
      return Promise.resolve();
    }

    removeCapability(capability: string): Promise<void> {
      this.capabilities.delete(capability);
      this.capabilityValues.delete(capability);
      return Promise.resolve();
    }

    setCapabilityValue(capability: string, value: any): Promise<void> {
      if (!this.capabilities.has(capability)) {
        throw new Error(`Capability ${capability} not found`);
      }
      this.capabilityValues.set(capability, value);
      this.emit('capability', capability, value);
      return Promise.resolve();
    }

    getCapabilityValue(capability: string): any {
      return this.capabilityValues.get(capability);
    }

    registerCapabilityListener(capability: string, listener: (...args: any[]) => void): void {
      this.on(`capability.${capability}`, listener);
    }

    setSettings(settings: any): Promise<void> {
      Object.entries(settings).forEach(([key, value]) => {
        this.settings.set(key, value);
      });
      return Promise.resolve();
    }

    getSettings(): any {
      return Object.fromEntries(this.settings);
    }

    getSetting(key: string): any {
      return this.settings.get(key);
    }

    setAvailable(): Promise<void> {
      this.available = true;
      return Promise.resolve();
    }

    setUnavailable(reason?: string): Promise<void> {
      this.available = false;
      return Promise.resolve();
    }

    isAvailable(): boolean {
      return this.available;
    }
  },

  Driver: class MockDriver extends EventEmitter {
    private devices = new Map<string, any>();

    constructor() {
      super();
    }

    log(...args: any[]) {
      console.log('[MOCK DRIVER]', ...args);
    }

    error(...args: any[]) {
      console.error('[MOCK DRIVER ERROR]', ...args);
    }

    getDevices(): any[] {
      return Array.from(this.devices.values());
    }

    getDevice(data: any): any {
      return this.devices.get(data.id);
    }
  },

  App: class MockApp extends EventEmitter {
    constructor() {
      super();
    }

    log(...args: any[]) {
      console.log('[MOCK APP]', ...args);
    }

    error(...args: any[]) {
      console.error('[MOCK APP ERROR]', ...args);
    }
  }
};

// Make Homey mock globally available
(global as any).Homey = mockHomey;
