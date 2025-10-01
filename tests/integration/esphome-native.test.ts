/// <reference types="jest" />

import { ESPHomeClient, ESPHomeEntities } from '../../lib/esphome-client-native';

// Configuration for integration tests
const SKIP_INTEGRATION_TESTS = process.env.SKIP_INTEGRATION_TESTS !== 'false';
const TEST_DEVICE_IP = process.env.TEST_DEVICE_IP || '192.168.200.80';
const TEST_DEVICE_PORT = parseInt(process.env.TEST_DEVICE_PORT || '6053');
const TEST_ENCRYPTION_KEY = process.env.TEST_ENCRYPTION_KEY || 'Quvqw/PaxsHQ90BGdFN1jgDJ8iGgX2QfGVdvZttBemA=';

describe('ESPHome Native API Integration Test', () => {
  it('should successfully connect using the native API library', async () => {
    if (SKIP_INTEGRATION_TESTS) {
      return; // Skip test if integration tests are disabled
    }

    const client = new ESPHomeClient(TEST_DEVICE_IP, TEST_DEVICE_PORT, TEST_ENCRYPTION_KEY);
    
    try {
      await client.init();
      
      // Set up listeners BEFORE connecting to avoid race conditions
      const deviceInfoPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Device info timeout')), 10000);
        
        client.once('deviceInfo', (info) => {
          clearTimeout(timeout);
          resolve(info);
        });
      });

      const entitiesPromise = new Promise<ESPHomeEntities>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Entities timeout')), 10000);
        
        client.once('entities', (entitiesData) => {
          clearTimeout(timeout);
          resolve(entitiesData as ESPHomeEntities);
        });
      });

      // Now connect
      await client.connect();
      expect(client.isConnected()).toBe(true);
      console.log('✅ Native API connection successful!');

      // Wait for device info
      const deviceInfo = await deviceInfoPromise;

      expect(deviceInfo).toBeDefined();
      expect(deviceInfo).toMatchObject({
        name: expect.any(String),
        macAddress: expect.stringMatching(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
      });

      console.log('📱 Device info:', deviceInfo);

      // Wait for entities
      const entities = await entitiesPromise;

      expect(entities).toBeDefined();
      console.log('📊 Entities discovered:');
      console.log('  Sensors:', entities.sensors.size);
      console.log('  Climates:', entities.climates.size);
      console.log('  Switches:', entities.switches.size);

      // Show detailed entity information
      console.log('\n🔍 DETAILED ENTITY ANALYSIS:');
      console.log('============================');
      
      if (entities.sensors.size > 0) {
        console.log('\n🌡️ SENSORS:');
        entities.sensors.forEach((sensor: any, key: any) => {
          console.log(`  - Key: ${key}, Name: "${sensor.name}", ObjectId: "${sensor.objectId}"`);
          console.log(`    Unit: ${sensor.unitOfMeasurement}, Device Class: ${sensor.deviceClass}`);
          console.log(`    Icon: ${sensor.icon}`);
        });
      }
      
      if (entities.climates.size > 0) {
        console.log('\n🏠 CLIMATES:');
        entities.climates.forEach((climate: any, key: any) => {
          console.log(`  - Key: ${key}, Name: "${climate.name}", ObjectId: "${climate.objectId}"`);
          console.log(`    Supported Modes: ${JSON.stringify(climate.supportedModes)}`);
          console.log(`    Temperature Range: ${climate.visualMinTemperature}°C - ${climate.visualMaxTemperature}°C`);
        });
      }
      
      if (entities.switches.size > 0) {
        console.log('\n🔌 SWITCHES:');
        entities.switches.forEach((switchEntity: any, key: any) => {
          console.log(`  - Key: ${key}, Name: "${switchEntity.name}", ObjectId: "${switchEntity.objectId}"`);
          console.log(`    Icon: ${switchEntity.icon}`);
        });
      }
      
      if (entities.lights && entities.lights.size > 0) {
        console.log('\n💡 LIGHTS:');
        entities.lights.forEach((light: any, key: any) => {
          console.log(`  - Key: ${key}, Name: "${light.name}", ObjectId: "${light.objectId}"`);
        });
      }
      
      // Check raw native entities for additional types
      console.log('\n🔍 RAW NATIVE ENTITIES:');
      const nativeEntities = (client as any).nativeClient.entities;
      console.log(`Total native entities: ${Object.keys(nativeEntities).length}`);
      
      Object.values(nativeEntities).forEach((entity: any) => {
        const entityType = entity.constructor.name;
        console.log(`  - Key: ${entity.id}, Type: ${entityType}, Name: "${entity.name}", ObjectId: "${entity.config?.objectId || 'N/A'}"`);
        if (entity.config?.unitOfMeasurement) console.log(`    Unit: ${entity.config.unitOfMeasurement}`);
        if (entity.config?.deviceClass) console.log(`    Device Class: ${entity.config.deviceClass}`);
        if (entity.config?.icon) console.log(`    Icon: ${entity.config.icon}`);
        if (entity.config?.supportedModes) console.log(`    Supported Modes: ${JSON.stringify(entity.config.supportedModes)}`);
      });
      
      console.log('\n🎯 HOMEY CAPABILITIES MAPPING:');
      console.log('==============================');
      const capabilities = new Set<string>();
      
      Object.values(nativeEntities).forEach((entity: any) => {
        const entityType = entity.constructor.name;
        console.log(`\n📋 Entity: "${entity.name}" (${entityType})`);
        
        switch (entityType) {
          case 'Sensor':
            if (entity.deviceClass === 'temperature') {
              capabilities.add('measure_temperature');
              console.log('  → measure_temperature');
            } else if (entity.deviceClass === 'pressure') {
              capabilities.add('measure_pressure');
              console.log('  → measure_pressure');
            } else if (entity.deviceClass === 'humidity') {
              capabilities.add('measure_humidity');
              console.log('  → measure_humidity');
            } else if (entity.deviceClass === 'power') {
              capabilities.add('measure_power');
              console.log('  → measure_power');
            } else if (entity.deviceClass === 'energy') {
              capabilities.add('meter_power');
              console.log('  → meter_power');
            } else if (entity.deviceClass === 'voltage') {
              capabilities.add('measure_voltage');
              console.log('  → measure_voltage');
            } else if (entity.deviceClass === 'current') {
              capabilities.add('measure_current');
              console.log('  → measure_current');
            } else {
              console.log(`  → Custom capability needed for device class: ${entity.deviceClass}`);
            }
            break;
            
          case 'Climate':
            capabilities.add('target_temperature');
            capabilities.add('thermostat_mode');
            capabilities.add('measure_temperature');
            console.log('  → target_temperature, thermostat_mode, measure_temperature');
            break;
            
          case 'Switch':
            capabilities.add('onoff');
            console.log('  → onoff');
            break;
            
          case 'Light':
            capabilities.add('onoff');
            capabilities.add('dim');
            console.log('  → onoff, dim');
            break;
            
          case 'BinarySensor':
            if (entity.deviceClass === 'motion') {
              capabilities.add('alarm_motion');
              console.log('  → alarm_motion');
            } else if (entity.deviceClass === 'door' || entity.deviceClass === 'window') {
              capabilities.add('alarm_contact');
              console.log('  → alarm_contact');
            } else if (entity.deviceClass === 'problem') {
              capabilities.add('alarm_generic');
              console.log('  → alarm_generic');
            } else {
              console.log(`  → Custom alarm capability for device class: ${entity.deviceClass}`);
            }
            break;
            
          case 'TextSensor':
            console.log('  → Custom text capability needed');
            break;
            
          case 'Number':
            console.log('  → Custom number capability needed');
            break;
            
          default:
            console.log(`  → Unknown entity type: ${entityType}`);
        }
      });
      
      console.log('\n📝 COMPLETE HOMEY CAPABILITIES ARRAY:');
      console.log('=====================================');
      const capabilitiesArray = Array.from(capabilities).sort();
      console.log(JSON.stringify(capabilitiesArray, null, 2));

      // Verify we have some entities (THZ-504 should have many)
      expect(entities.sensors.size).toBeGreaterThan(0);
      expect(entities.climates.size).toBeGreaterThan(0);

      client.disconnect();
      
    } catch (error: any) {
      if (error?.code === 'ECONNRESET' || error?.message?.includes('ECONNRESET')) {
        console.log('ℹ️  ESP32 connection rejected - Home Assistant is likely already connected');
        // Skip test if device is busy with existing connection
        return;
      } else {
        console.log('❌ Integration test failed:', error);
        throw error;
      }
    }
  }, 30000);
});
