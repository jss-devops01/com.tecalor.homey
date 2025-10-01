/// <reference types="jest" />

import { ESPHomeClient } from '../../../lib/esphome-client-native';

// Mock the ESPHomeClient
jest.mock('../../../lib/esphome-client-native');

describe('THZ504Device', () => {
  let Device: any;
  let device: any;
  let mockESPHomeClient: jest.Mocked<ESPHomeClient>;
  let mockSettings: any;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock ESPHomeClient
    mockESPHomeClient = {
      init: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      setClimateTemperature: jest.fn().mockResolvedValue(undefined),
      setClimateMode: jest.fn().mockResolvedValue(undefined),
      setSwitchState: jest.fn().mockResolvedValue(undefined),
      setLightState: jest.fn().mockResolvedValue(undefined),
      once: jest.fn().mockReturnThis(),
      emit: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      off: jest.fn().mockReturnThis(),
      removeAllListeners: jest.fn().mockReturnThis(),
      getEntities: jest.fn().mockReturnValue({
        sensors: [],
        climate: [],
        textSensors: [],
        switches: [],
        lights: []
      }),
      getDeviceInfo: jest.fn().mockReturnValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
    } as any;

    (ESPHomeClient as jest.MockedClass<typeof ESPHomeClient>).mockImplementation(() => mockESPHomeClient);

    // Mock settings
    mockSettings = {
      ip_address: '192.168.200.80',
      port: 6053,
      encryption_key: 'test-key',
      poll_interval: 30
    };

    // Import and instantiate the device
    Device = require('../../../drivers/thz-504/device');
    device = new Device();
    
    // Mock device methods from Homey.Device
    device.log = jest.fn();
    device.error = jest.fn();
    device.getSettings = jest.fn().mockReturnValue(mockSettings);
    device.hasCapability = jest.fn().mockReturnValue(true);
    device.addCapability = jest.fn().mockResolvedValue(undefined);
    device.removeCapability = jest.fn().mockResolvedValue(undefined);
    device.setCapabilityValue = jest.fn().mockResolvedValue(undefined);
    device.getCapabilityValue = jest.fn().mockReturnValue(20);
    device.registerCapabilityListener = jest.fn();
    device.setAvailable = jest.fn().mockResolvedValue(undefined);
    device.setUnavailable = jest.fn().mockResolvedValue(undefined);
    device.getData = jest.fn().mockReturnValue({ id: 'test-device' });
  });

  describe('onInit', () => {
    it('should initialize the device successfully', async () => {
      // Setup successful connection
      mockESPHomeClient.on.mockImplementation((event: string | symbol, callback: (...args: any[]) => void) => {
        if (event === 'connected') {
          setTimeout(() => callback(), 10);
        }
        return mockESPHomeClient;
      });

      await device.onInit();

      expect(device.log).toHaveBeenCalledWith('THZ-504 ESPHome Device has been initialized');
      expect(device.registerCapabilityListener).toHaveBeenCalledWith('target_temperature', expect.any(Function));
      expect(device.registerCapabilityListener).toHaveBeenCalledWith('thermostat_mode', expect.any(Function));
      expect(device.registerCapabilityListener).toHaveBeenCalledWith('onoff', expect.any(Function));
    });

    it('should handle connection errors during initialization', async () => {
      mockESPHomeClient.connect.mockRejectedValue(new Error('Connection failed'));

      await device.onInit();

      expect(device.error).toHaveBeenCalledWith(expect.stringContaining('Connection failed'));
      expect(device.setUnavailable).toHaveBeenCalled();
    });
  });

  describe('capability listeners', () => {
    beforeEach(async () => {
      mockESPHomeClient.on.mockImplementation((event: string | symbol, callback: (...args: any[]) => void) => {
        if (event === 'connected') {
          setTimeout(() => callback(), 10);
        }
        return mockESPHomeClient;
      });

      await device.onInit();
    });

    describe('target_temperature', () => {
      it('should send climate command when target temperature changes', async () => {
        const newTemperature = 22.5;
        
        // Get the registered listener
        const listenerCall = device.registerCapabilityListener.mock.calls.find(
          (call: any[]) => call[0] === 'target_temperature'
        );
        const listener = listenerCall![1];

        await listener(newTemperature);

        expect(mockESPHomeClient.setClimateTemperature).toHaveBeenCalledWith(
          expect.any(Number),
          newTemperature
        );
      });

      it('should handle invalid temperature values', async () => {
        const listenerCall = device.registerCapabilityListener.mock.calls.find(
          (call: any[]) => call[0] === 'target_temperature'
        );
        const listener = listenerCall![1];

        await listener(null);

        expect(mockESPHomeClient.setClimateTemperature).not.toHaveBeenCalled();
        expect(device.error).toHaveBeenCalledWith(expect.stringContaining('Invalid temperature'));
      });
    });

    describe('thermostat_mode', () => {
      it('should send climate command when thermostat mode changes', async () => {
        const newMode = 'heat';
        
        const listenerCall = device.registerCapabilityListener.mock.calls.find(
          (call: any[]) => call[0] === 'thermostat_mode'
        );
        const listener = listenerCall![1];

        await listener(newMode);

        expect(mockESPHomeClient.setClimateMode).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number)
        );
      });

      it('should handle unknown thermostat modes', async () => {
        const listenerCall = device.registerCapabilityListener.mock.calls.find(
          (call: any[]) => call[0] === 'thermostat_mode'
        );
        const listener = listenerCall![1];

        await listener('unknown_mode');

        expect(device.error).toHaveBeenCalledWith(expect.stringContaining('Unknown thermostat mode'));
      });
    });

    describe('onoff', () => {
      it('should send switch command when switch state changes', async () => {
        const newState = true;
        
        const listenerCall = device.registerCapabilityListener.mock.calls.find(
          (call: any[]) => call[0] === 'onoff'
        );
        const listener = listenerCall![1];

        await listener(newState);

        expect(mockESPHomeClient.setSwitchState).toHaveBeenCalledWith(
          expect.any(Number),
          newState
        );
      });
    });
  });

  describe('entity state updates', () => {
    beforeEach(async () => {
      mockESPHomeClient.on.mockImplementation((event: string | symbol, callback: (...args: any[]) => void) => {
        if (event === 'connected') {
          setTimeout(() => callback(), 10);
        }
        return mockESPHomeClient;
      });

      await device.onInit();
    });

    it('should update temperature capability when sensor state changes', async () => {
      const sensorState = {
        key: 1,
        state: 21.5,
        missingState: false
      };

      // Get the sensor state handler
      const onCall = mockESPHomeClient.on.mock.calls.find(
        (call: any[]) => call[0] === 'sensorState'
      );
      
      if (onCall) {
        const handler = onCall[1];
        await handler(sensorState);
        expect(device.setCapabilityValue).toHaveBeenCalledWith('measure_temperature', 21.5);
      }
    });

    it('should handle missing sensor states', async () => {
      const sensorState = {
        key: 1,
        state: 0,
        missingState: true
      };

      const onCall = mockESPHomeClient.on.mock.calls.find(
        (call: any[]) => call[0] === 'sensorState'
      );
      
      if (onCall) {
        const handler = onCall[1];
        await handler(sensorState);
        // Should not update capability when state is missing
        expect(device.setCapabilityValue).not.toHaveBeenCalled();
      }
    });
  });

  describe('connection management', () => {
    it('should handle connection loss', async () => {
      mockESPHomeClient.on.mockImplementation((event: string | symbol, callback: (...args: any[]) => void) => {
        if (event === 'disconnected') {
          setTimeout(() => callback(), 10);
        }
        return mockESPHomeClient;
      });

      await device.onInit();

      expect(device.setUnavailable).toHaveBeenCalledWith('Connection lost');
    });

    it('should handle client errors', async () => {
      const error = new Error('Client error');

      mockESPHomeClient.on.mockImplementation((event: string | symbol, callback: (...args: any[]) => void) => {
        if (event === 'error') {
          setTimeout(() => callback(error), 10);
        }
        return mockESPHomeClient;
      });

      await device.onInit();

      expect(device.error).toHaveBeenCalledWith('ESPHome client error:', error);
      expect(device.setUnavailable).toHaveBeenCalledWith(`Error: ${error.message}`);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on device deleted', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      await device.onInit();
      await device.onDeleted();

      expect(mockESPHomeClient.disconnect).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});
