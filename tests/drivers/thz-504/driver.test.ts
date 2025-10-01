/// <reference types="jest" />

import { ESPHomeClient } from '../../../lib/esphome-client-native';

// Mock the ESPHomeClient
jest.mock('../../../lib/esphome-client-native');

describe('THZ504Driver', () => {
  let Driver: any;
  let driver: any;
  let mockESPHomeClient: jest.Mocked<ESPHomeClient>;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock ESPHomeClient
    mockESPHomeClient = {
      init: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(false),
      getEntities: jest.fn().mockReturnValue({ sensors: new Map(), climates: new Map(), switches: new Map(), lights: new Map() }),
      setClimateTemperature: jest.fn().mockResolvedValue(undefined),
      setClimateMode: jest.fn().mockResolvedValue(undefined),
      setSwitchState: jest.fn().mockResolvedValue(undefined),
      setLightState: jest.fn().mockResolvedValue(undefined),
      subscribeToStates: jest.fn().mockResolvedValue(undefined),
      getDeviceInfo: jest.fn().mockResolvedValue(undefined),
      once: jest.fn().mockReturnThis(),
      emit: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      off: jest.fn().mockReturnThis(),
      removeAllListeners: jest.fn().mockReturnThis(),
    } as any;

    (ESPHomeClient as jest.MockedClass<typeof ESPHomeClient>).mockImplementation(() => mockESPHomeClient);

    // Import and instantiate the driver
    Driver = require('../../../drivers/thz-504/driver');
    driver = new Driver();
    
    // Mock driver methods from Homey.Driver
    driver.log = jest.fn();
    driver.error = jest.fn();
  });

  describe('onInit', () => {
    it('should initialize the driver successfully', async () => {
      await driver.onInit();
      
      expect(driver.log).toHaveBeenCalledWith('THZ-504 ESPHome Driver has been initialized');
    });
  });

  describe('onPairListDevices', () => {
    it('should discover devices successfully', async () => {
      const mockDeviceInfo = {
        name: 'THZ-504',
        friendlyName: 'Heat Pump',
        macAddress: '00:11:22:33:44:55'
      };

      let connectionAttempts = 0;
      
      // Setup mock client behavior for successful discovery on first IP only
      mockESPHomeClient.connect.mockImplementation(() => {
        connectionAttempts++;
        if (connectionAttempts === 1) {
          // First IP succeeds
          return Promise.resolve();
        } else {
          // Other IPs fail
          return Promise.reject(new Error('Connection failed'));
        }
      });
      
      mockESPHomeClient.once.mockImplementation((event: string | symbol, callback: (...args: any[]) => void) => {
        if (event === 'deviceInfo' && connectionAttempts === 1) {
          setTimeout(() => callback(mockDeviceInfo), 10);
        }
        return mockESPHomeClient;
      });

      const devices = await driver.onPairListDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0]).toMatchObject({
        name: expect.stringContaining('Heat Pump'),
        data: {
          id: '00:11:22:33:44:55'
        },
        settings: {
          ip_address: '192.168.200.80',
          port: 6053,
          encryption_key: expect.any(String)
        },
        capabilities: expect.arrayContaining([
          'measure_temperature',
          'target_temperature',
          'thermostat_mode',
          'onoff'
        ])
      });
    });

    it('should return manual configuration when no devices found', async () => {
      // Setup mock client behavior for failed discovery
      mockESPHomeClient.connect.mockRejectedValue(new Error('Connection failed'));

      const devices = await driver.onPairListDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0]).toMatchObject({
        name: 'THZ-504 ESPHome Device (Manual Configuration)',
        data: {
          id: 'thz504-manual'
        },
        settings: {
          ip_address: '192.168.200.80',
          port: 6053,
          encryption_key: expect.any(String)
        }
      });
    });

    it('should handle connection timeout during discovery', async () => {
      // Setup mock client behavior for timeout
      mockESPHomeClient.connect.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 6000);
        })
      );

      const devices = await driver.onPairListDevices();

      // Should fallback to manual configuration
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toContain('Manual Configuration');
    }, 10000); // 10 second timeout

    it('should handle device info timeout', async () => {
      // Setup mock client behavior - connection succeeds but no device info
      mockESPHomeClient.connect.mockResolvedValue(undefined);
      mockESPHomeClient.once.mockImplementation((event: string | symbol, callback: Function) => {
        // Don't call callback for 'deviceInfo' event to simulate timeout
        return mockESPHomeClient;
      });

      const devices = await driver.onPairListDevices();

      // Should fallback to manual configuration
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toContain('Manual Configuration');
    }, 10000); // 10 second timeout

    it('should try multiple IP addresses', async () => {
      // Setup mock to fail for first two IPs, succeed for third
      let callCount = 0;
      mockESPHomeClient.connect.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve();
      });

      const mockDeviceInfo = {
        name: 'THZ-504',
        friendlyName: 'Heat Pump',
        macAddress: '00:11:22:33:44:55'
      };

      mockESPHomeClient.once.mockImplementation((event: string | symbol, callback: (...args: any[]) => void) => {
        if (event === 'deviceInfo' && callCount >= 3) {
          setTimeout(() => callback(mockDeviceInfo), 10);
        }
        return mockESPHomeClient;
      });

      const devices = await driver.onPairListDevices();

      expect(ESPHomeClient).toHaveBeenCalledTimes(3);
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toContain('Heat Pump');
    });

    it('should properly disconnect client after discovery attempt', async () => {
      const mockDeviceInfo = {
        name: 'THZ-504',
        friendlyName: 'Heat Pump',
        macAddress: '00:11:22:33:44:55'
      };

      mockESPHomeClient.once.mockImplementation((event: string | symbol, callback: (...args: any[]) => void) => {
        if (event === 'deviceInfo') {
          setTimeout(() => callback(mockDeviceInfo), 10);
        }
        return mockESPHomeClient;
      });

      await driver.onPairListDevices();

      expect(mockESPHomeClient.disconnect).toHaveBeenCalled();
    });

    it('should log discovery attempts', async () => {
      mockESPHomeClient.connect.mockRejectedValue(new Error('Connection failed'));

      await driver.onPairListDevices();

      expect(driver.log).toHaveBeenCalledWith('Starting device discovery');
      expect(driver.log).toHaveBeenCalledWith(expect.stringContaining('Trying to discover device at'));
      expect(driver.log).toHaveBeenCalledWith(expect.stringContaining('Discovered'));
    });
  });

  describe('error handling', () => {
    it('should handle ESPHomeClient creation errors', async () => {
      (ESPHomeClient as jest.MockedClass<typeof ESPHomeClient>).mockImplementation(() => {
        throw new Error('Client creation failed');
      });

      const devices = await driver.onPairListDevices();

      // Should fallback to manual configuration
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toContain('Manual Configuration');
    });

    it('should handle client init errors', async () => {
      mockESPHomeClient.init.mockRejectedValue(new Error('Init failed'));

      const devices = await driver.onPairListDevices();

      // Should fallback to manual configuration
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toContain('Manual Configuration');
    });
  });
});
