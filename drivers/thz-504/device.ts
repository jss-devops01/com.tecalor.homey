import Homey from 'homey';
import { ESPHomeClient } from '../../lib/esphome-client-native';

interface DeviceSettings {
  ip_address: string;
  port: number;
  encryption_key?: string;
  poll_interval: number;
}

class THZ504DeviceComprehensive extends Homey.Device {
  private client: ESPHomeClient | null = null;
  private entityMappings: Map<string, string> = new Map();
  private entityKeys: Map<string, number> = new Map(); // Maps entity object_id to numeric key
  private customCapabilities: Set<string> = new Set();

  async onInit() {
    this.log('THZ504 Comprehensive Device has been initialized');

    // Initialize entity mappings
    this.initializeEntityMappings();

    // Initialize ESPHome client
    const settings = this.getSettings() as DeviceSettings;
    const ip = settings.ip_address;
    const port = settings.port || 6053;
    const encryptionKey = settings.encryption_key;

    if (!ip || !encryptionKey) {
      this.error('Missing IP address or encryption key');
      return;
    }

    this.client = new ESPHomeClient(ip, port, encryptionKey);

    // Set up event listeners
    this.setupEventListeners();

    // Connect to ESP device
    try {
      await this.client.init();
      await this.client.connect();
      this.log('Connected to ESP device');
      this.setAvailable();
    } catch (error) {
      this.error('Failed to connect to ESP device:', error);
      this.setUnavailable('Cannot connect to ESP device');
    }

    // Register capability listeners
    this.registerCapabilityListeners();
  }

  private initializeEntityMappings() {
    // Temperature sensors - using actual objectIds from ESP32 device
    this.entityMappings.set('room_temp_actual', 'measure_temperature.setting'); // Main room temp
    this.entityMappings.set('outside_temp', 'measure_temperature.outside');
    this.entityMappings.set('flow_temp_actual', 'measure_temperature.flow');
    this.entityMappings.set('return_temp_actual', 'measure_temperature.return');
    this.entityMappings.set('storage_temp_actual', 'measure_temperature.storage');
    this.entityMappings.set('evaporator_temp', 'measure_temperature.evaporator');
    this.entityMappings.set('collector_temp_actual', 'measure_temperature.collector');
    this.entityMappings.set('exhaust_air_temp', 'measure_temperature.exhaust_air');

    // Pressure sensors
    this.entityMappings.set('low_pressure_display', 'measure_pressure.low');
    this.entityMappings.set('differential_pressure', 'measure_pressure.differential');

    // Power/Energy sensors
    this.entityMappings.set('heat_output_heating_day_total_kwh', 'meter_power.heating_day');
    this.entityMappings.set('heat_output_dhw_day_total_kwh', 'meter_power.dhw_day');
    this.entityMappings.set('heat_output_2we_heating_day_total_kwh', 'meter_power.2we_heating_day');
    this.entityMappings.set('heat_output_2we_dhw_day_total_kwh', 'meter_power.2we_dhw_day');
    this.entityMappings.set('electric_energy_heating_total_kwh', 'meter_power.electric_heating');
    this.entityMappings.set('electric_energy_dhw_total_kwh', 'meter_power.electric_dhw');
    this.entityMappings.set('heating_cooling_power', 'measure_power.heating_cooling');
    this.entityMappings.set('electric_heating_power', 'measure_power.electric_heating');
    this.entityMappings.set('motor_power', 'measure_power.motor');
    this.entityMappings.set('fan_power', 'measure_power.fan');

    // Humidity sensors
    this.entityMappings.set('room_humidity', 'measure_humidity.room');
    this.entityMappings.set('exhaust_air_humidity', 'measure_humidity.exhaust_air');

    // Flow/Volume sensors
    this.entityMappings.set('volume_flow', 'measure_power');
    this.entityMappings.set('supply_air_setpoint', 'measure_power');
    this.entityMappings.set('exhaust_air_setpoint', 'measure_power');
    this.entityMappings.set('outdoor_air_setpoint', 'measure_power');

    // Current/Voltage sensors
    this.entityMappings.set('motor_current', 'measure_current');
    this.entityMappings.set('motor_voltage', 'measure_voltage');

    // Efficiency/Performance sensors
    this.entityMappings.set('cop_heating_day', 'measure_power');
    this.entityMappings.set('cop_dhw_day', 'measure_power');
    this.entityMappings.set('heating_power_relative', 'measure_power');
    this.entityMappings.set('flow_share_hc1', 'measure_power');

    // Counter/Time sensors
    this.entityMappings.set('compressor_starts', 'measure_power');
    this.entityMappings.set('compressor_speed', 'measure_power');
    this.entityMappings.set('filter_runtime', 'measure_power');
    this.entityMappings.set('filter_runtime_days', 'measure_power');

    // Binary sensors (alarms/status) - using actual objectIds
    this.entityMappings.set('defrost_evaporator', 'alarm_generic.defrost');
    this.entityMappings.set('heating', 'alarm_generic.heating');
    this.entityMappings.set('cooling', 'alarm_generic.cooling');
    this.entityMappings.set('dhw_heating', 'alarm_generic.dhw_heating');
    this.entityMappings.set('compressor', 'alarm_generic.compressor');
    this.entityMappings.set('heating_circuit_pump', 'alarm_generic.pump');
    this.entityMappings.set('ventilation', 'alarm_generic.ventilation');
    this.entityMappings.set('electric_backup_heating', 'alarm_generic.electric_backup');
    this.entityMappings.set('filter_change_both', 'alarm_generic.filter_both');
    this.entityMappings.set('filter_change_supply', 'alarm_generic.filter_supply');
    this.entityMappings.set('filter_change_exhaust', 'alarm_generic.filter_exhaust');
    this.entityMappings.set('utility_lockout', 'alarm_generic.utility_lockout');
    this.entityMappings.set('summer_mode_active', 'alarm_generic.summer_mode');
    this.entityMappings.set('switch_program_active', 'alarm_generic.switch_program');
    this.entityMappings.set('heatup_program_active', 'alarm_generic.heatup_program');
    this.entityMappings.set('stove_fireplace_active', 'alarm_generic.stove_fireplace');
    this.entityMappings.set('service', 'alarm_generic.service');

    // Control switches - using actual objectIds
    this.entityMappings.set('cooling_mode', 'onoff.cooling');
    this.entityMappings.set('dhw_eco', 'onoff.dhw_eco');

    // Climate controls - using actual objectIds
    this.entityMappings.set('heating_day', 'target_temperature'); // Main thermostat
    this.entityMappings.set('heating_night', 'target_temperature.heating_night');
    this.entityMappings.set('hot_water_night', 'target_temperature.hot_water_night');

    // Number controls - using actual objectIds  
    this.entityMappings.set('room_influence', 'heating_curve.room_influence');
    this.entityMappings.set('hysteresis_dhw', 'temperature_offset.hysteresis_dhw');
    this.entityMappings.set('design_power_heating', 'power_setting.design_heating');
    this.entityMappings.set('design_power_cooling', 'power_setting.design_cooling');
    this.entityMappings.set('pump_speed_heating', 'pump_speed.heating');
    this.entityMappings.set('backup_heater_level_dhw', 'backup_heater.level_dhw');
    this.entityMappings.set('vent_exhaust_level1', 'ventilation.exhaust_level1');
    this.entityMappings.set('vent_exhaust_level2', 'ventilation.exhaust_level2');
    this.entityMappings.set('vent_exhaust_level3', 'ventilation.exhaust_level3');
    this.entityMappings.set('vent_supply_level1', 'ventilation.supply_level1');
    this.entityMappings.set('vent_supply_level2', 'ventilation.supply_level2');
    this.entityMappings.set('vent_supply_level3', 'ventilation.supply_level3');

    // Fan controls - using actual objectIds
    this.entityMappings.set('vent_level_day', 'fan_speed.vent_day');
    this.entityMappings.set('vent_level_night', 'fan_speed.vent_night');
    this.entityMappings.set('vent_level_party', 'fan_speed.vent_party');

    // Select controls - using actual objectIds
    this.entityMappings.set('passive_cooling', 'operation_mode.passive_cooling');
    this.entityMappings.set('program_switch', 'operation_mode.program_switch');

    // Text sensors (stored as settings) - using actual objectIds
    this.entityMappings.set('heatpump_datetime', 'measure_power');
    this.entityMappings.set('error_message', 'measure_power');

    // ESP32 diagnostic sensors
    this.entityMappings.set('esp32-c6_uptime', 'measure_power');
    this.entityMappings.set('esp32-c6_wifi_signal', 'measure_signal_strength');
    this.entityMappings.set('esp32-c6_internal_temperature', 'measure_temperature.esp_internal');

    // Define which capabilities are custom and need to be added dynamically
    this.customCapabilities.add('measure_temperature.outside');
    this.customCapabilities.add('measure_temperature.flow');
    this.customCapabilities.add('measure_temperature.return');
    this.customCapabilities.add('measure_temperature.storage');
    this.customCapabilities.add('measure_temperature.evaporator');
    this.customCapabilities.add('measure_temperature.collector');
    this.customCapabilities.add('measure_temperature.exhaust_air');
    this.customCapabilities.add('measure_temperature.esp_internal');
    this.customCapabilities.add('measure_pressure.low');
    this.customCapabilities.add('measure_pressure.differential');
    this.customCapabilities.add('meter_power.heating_day');
    this.customCapabilities.add('meter_power.dhw_day');
    this.customCapabilities.add('meter_power.2we_heating_day');
    this.customCapabilities.add('meter_power.2we_dhw_day');
    this.customCapabilities.add('meter_power.electric_heating');
    this.customCapabilities.add('meter_power.electric_dhw');
    this.customCapabilities.add('measure_power.heating_cooling');
    this.customCapabilities.add('measure_power.electric_heating');
    this.customCapabilities.add('measure_power.motor');
    this.customCapabilities.add('measure_power.fan');
    this.customCapabilities.add('measure_humidity.room');
    this.customCapabilities.add('measure_humidity.exhaust_air');
    // Add all status and alarm capabilities
    this.customCapabilities.add('alarm_generic.defrost');
    this.customCapabilities.add('alarm_generic.heating');
    this.customCapabilities.add('alarm_generic.cooling');
    this.customCapabilities.add('alarm_generic.dhw_heating');
    this.customCapabilities.add('alarm_generic.compressor');
    this.customCapabilities.add('alarm_generic.pump');
    this.customCapabilities.add('alarm_generic.ventilation');
    this.customCapabilities.add('alarm_generic.electric_backup');
    this.customCapabilities.add('alarm_generic.filter_both');
    this.customCapabilities.add('alarm_generic.filter_supply');
    this.customCapabilities.add('alarm_generic.filter_exhaust');
    this.customCapabilities.add('alarm_generic.utility_lockout');
    this.customCapabilities.add('alarm_generic.summer_mode');
    this.customCapabilities.add('alarm_generic.switch_program');
    this.customCapabilities.add('alarm_generic.heatup_program');
    this.customCapabilities.add('alarm_generic.stove_fireplace');
    this.customCapabilities.add('alarm_generic.service');
    this.customCapabilities.add('onoff.cooling');
    this.customCapabilities.add('onoff.dhw_eco');
    this.customCapabilities.add('target_temperature.heating_night');
    this.customCapabilities.add('target_temperature.hot_water_day');
    this.customCapabilities.add('target_temperature.hot_water_night');
    // Add all number control capabilities
    this.customCapabilities.add('heating_curve.room_influence');
    this.customCapabilities.add('temperature_offset.hysteresis_dhw');
    this.customCapabilities.add('power_setting.design_heating');
    this.customCapabilities.add('power_setting.design_cooling');
    this.customCapabilities.add('pump_speed.heating');
    this.customCapabilities.add('backup_heater.level_dhw');
    this.customCapabilities.add('ventilation.exhaust_level1');
    this.customCapabilities.add('ventilation.exhaust_level2');
    this.customCapabilities.add('ventilation.exhaust_level3');
    this.customCapabilities.add('ventilation.supply_level1');
    this.customCapabilities.add('ventilation.supply_level2');
    this.customCapabilities.add('ventilation.supply_level3');
    this.customCapabilities.add('fan_speed.vent_day');
    this.customCapabilities.add('fan_speed.vent_night');
    this.customCapabilities.add('fan_speed.vent_party');
    this.customCapabilities.add('operation_mode.passive_cooling');
    this.customCapabilities.add('operation_mode.program_switch');
  }

  private async discoverEntities() {
    if (!this.client) return;
    
    this.log('Starting entity discovery...');
    
    try {
      // Give the client a moment to fully connect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Access the native client entities directly
      const nativeClient = (this.client as any).nativeClient;
      if (nativeClient && nativeClient.entities) {
        this.log('Accessing native client entities...');
        
        let mappedCount = 0;
        Object.values(nativeClient.entities).forEach((entity: any) => {
          // Log entity structure to debug the mapping issue
          this.log(`Entity structure:`, { 
            objectId: entity.config?.objectId, 
            id: entity.id, 
            key: entity.key,
            name: entity.config?.name,
            type: entity.type
          });
          
          if (entity.config?.objectId && entity.key !== undefined) {
            this.entityKeys.set(entity.config.objectId, entity.key);
            this.log(`Mapped ${entity.config.objectId} -> ${entity.key}`);
            mappedCount++;
          } else if (entity.config?.objectId && entity.id !== undefined) {
            this.entityKeys.set(entity.config.objectId, entity.id);
            this.log(`Mapped ${entity.config.objectId} -> ${entity.id}`);
            mappedCount++;
          }
        });
        
        this.log(`Total entities mapped: ${mappedCount}`);
        
        if (mappedCount === 0) {
          this.log('No entities found. Available entity keys:', Object.keys(nativeClient.entities || {}));
        }
      } else {
        this.log('Native client or entities not available');
        
        // Try alternative entity discovery methods
        if ((this.client as any).entities) {
          this.log('Trying client.entities...');
          Object.values((this.client as any).entities).forEach((entity: any) => {
            if (entity.objectId && entity.key !== undefined) {
              this.entityKeys.set(entity.objectId, entity.key);
              this.log(`Mapped via client.entities: ${entity.objectId} -> ${entity.key}`);
            }
          });
        }
      }
    } catch (error) {
      this.error('Error during entity discovery:', error);
    }
  }

  private getObjectIdFromEntityKey(entityKey: number): string | undefined {
    for (const [objectId, key] of this.entityKeys.entries()) {
      if (key === entityKey) {
        return objectId;
      }
    }
    return undefined;
  }

  private setupEventListeners() {
    if (!this.client) return;

    // Listen for entity discovery to map keys from raw native entities
    // Note: This event may not be reliable, using manual discovery instead
    this.client.on('entitiesListed', (entities: any) => {
      this.log('Entities discovered via event, building key mappings...');
      
      // Access the raw native entities to get the proper keys and objectIds
      const nativeEntities = (this.client as any).nativeClient.entities;
      let mappedCount = 0;
      
      Object.values(nativeEntities).forEach((entity: any) => {
        if (entity.config?.objectId && entity.id) {
          this.entityKeys.set(entity.config.objectId, entity.id);
          this.log(`Mapped ${entity.config.objectId} -> ${entity.id}`);
          mappedCount++;
        }
      });
      
      this.log(`Total entities mapped via event: ${mappedCount}`);
    });

    // Listen for device state changes (with proper typing)
    this.client.on('sensorState', (data: any) => {
      this.log('Raw sensor data received:', JSON.stringify(data, null, 2));
      this.updateSensorCapability(data);
    });

    this.client.on('binarySensorState', (data: any) => {
      this.log('Raw binary sensor data received:', JSON.stringify(data, null, 2));
      this.updateBinarySensorCapability(data);
    });

    this.client.on('climateState', (data: any) => {
      this.log('Raw climate data received:', JSON.stringify(data, null, 2));
      this.updateClimateCapability(data);
    });

    this.client.on('switchState', (data: any) => {
      this.log('Raw switch data received:', JSON.stringify(data, null, 2));
      this.updateSwitchCapability(data);
    });

    this.client.on('lightState', (data: any) => {
      this.log('Raw light data received:', JSON.stringify(data, null, 2));
      this.updateLightCapability(data);
    });

    this.client.on('textSensorState', (data: any) => {
      this.log('Raw text sensor data received:', JSON.stringify(data, null, 2));
      this.updateTextSensorCapability(data);
    });

    this.client.on('numberState', (data: any) => {
      this.log('Raw number data received:', JSON.stringify(data, null, 2));
      this.updateNumberCapability(data);
    });

    this.client.on('fanState', (data: any) => {
      this.log('Raw fan data received:', JSON.stringify(data, null, 2));
      this.updateFanCapability(data);
    });

    // Connection events
    this.client.on('connected', () => {
      this.log('ESP device connected');
      this.setAvailable();
      
      // Trigger entity discovery after connection
      this.discoverEntities();
    });

    this.client.on('disconnected', () => {
      this.log('ESP device disconnected');
      this.setUnavailable('Device disconnected');
    });

    this.client.on('error', (error: any) => {
      this.error('ESP device error:', error);
      this.setUnavailable('Device error: ' + error.message);
    });
  }

  private async addCapabilityIfNeeded(capability: string, options?: any): Promise<void> {
    if (!this.hasCapability(capability)) {
      try {
        await this.addCapability(capability);
        if (options) {
          await this.setCapabilityOptions(capability, options);
        }
        this.log(`Added capability: ${capability}${options?.title ? ` (${options.title.en})` : ''}`);
      } catch (err) {
        this.error(`Failed to add capability ${capability}:`, err);
      }
    } else if (options) {
      // Update options for existing capability
      try {
        await this.setCapabilityOptions(capability, options);
      } catch (err) {
        this.error(`Failed to set options for capability ${capability}:`, err);
      }
    }
  }

  public getCapabilityOptions(capability: string, entityName?: string): any {
    // Return capability options with proper titles and descriptions
    const options: any = {};

    // Handle sub-capabilities for temperature sensors
    if (capability.startsWith('measure_temperature.')) {
      const subType = capability.split('.')[1];
      switch (subType) {
        case 'storage':
          options.title = { en: 'Storage Temperature' };
          options.desc = { en: 'DHW tank temperature' };
          break;
        case 'outside':
          options.title = { en: 'Outside Temperature' };
          options.desc = { en: 'Ambient temperature' };
          break;
        case 'collector':
          options.title = { en: 'Collector Temperature' };
          options.desc = { en: 'Heat exchanger temperature' };
          break;
        case 'heating_flow':
          options.title = { en: 'Heating Flow Temperature' };
          options.desc = { en: 'Heating circuit flow temperature' };
          break;
        case 'heating_return':
          options.title = { en: 'Heating Return Temperature' };
          options.desc = { en: 'Heating circuit return temperature' };
          break;
        default:
          options.title = { en: `Temperature (${subType})` };
      }
    }

    // Handle sub-capabilities for pressure sensors
    if (capability.startsWith('measure_pressure.')) {
      const subType = capability.split('.')[1];
      switch (subType) {
        case 'differential':
          options.title = { en: 'Differential Pressure' };
          options.desc = { en: 'Pressure difference across heat exchanger' };
          break;
        case 'low':
          options.title = { en: 'Low Pressure' };
          options.desc = { en: 'Low side refrigerant pressure' };
          break;
        case 'high':
          options.title = { en: 'High Pressure' };
          options.desc = { en: 'High side refrigerant pressure' };
          break;
        default:
          options.title = { en: `Pressure (${subType})` };
      }
    }

    // Handle sub-capabilities for power sensors
    if (capability.startsWith('measure_power.')) {
      const subType = capability.split('.')[1];
      switch (subType) {
        case 'compressor':
          options.title = { en: 'Compressor Power' };
          options.desc = { en: 'Compressor electrical consumption' };
          break;
        case 'heating':
          options.title = { en: 'Heating Power' };
          options.desc = { en: 'Heating circuit power output' };
          break;
        case 'electric_heating':
          options.title = { en: 'Electric Heating Power' };
          options.desc = { en: 'Backup electric heater power' };
          break;
        case 'total':
          options.title = { en: 'Total Power' };
          options.desc = { en: 'Total system power consumption' };
          break;
        default:
          options.title = { en: `Power (${subType})` };
      }
    }

    // Handle status and alarm capabilities with meaningful names
    if (capability.startsWith('alarm_generic.')) {
      const subType = capability.split('.')[1];
      switch (subType) {
        case 'defrost':
          options.title = { en: 'Defrost Alarm' };
          options.desc = { en: 'Evaporator defrost cycle active' };
          break;
        case 'filter_both':
          options.title = { en: 'Filter Change (Both)' };
          options.desc = { en: 'Both ventilation filters need replacement' };
          break;
        case 'filter_supply':
          options.title = { en: 'Filter Change (Supply)' };
          options.desc = { en: 'Supply air filter needs replacement' };
          break;
        case 'filter_exhaust':
          options.title = { en: 'Filter Change (Exhaust)' };
          options.desc = { en: 'Exhaust air filter needs replacement' };
          break;
        case 'electric_backup':
          options.title = { en: 'Electric Backup Active' };
          options.desc = { en: 'Electric backup heating is running' };
          break;
        case 'utility_lockout':
          options.title = { en: 'Utility Lockout' };
          options.desc = { en: 'Utility company remote lockout active' };
          break;
        default:
          options.title = { en: `Alarm (${subType})` };
      }
    }

    // Handle status capabilities
    if (capability.startsWith('status_')) {
      const statusType = capability.replace('status_', '');
      switch (statusType) {
        case 'heating':
          options.title = { en: 'Heating Active' };
          options.desc = { en: 'Heating mode is currently active' };
          break;
        case 'cooling':
          options.title = { en: 'Cooling Active' };
          options.desc = { en: 'Cooling mode is currently active' };
          break;
        case 'dhw_heating':
          options.title = { en: 'DHW Heating Active' };
          options.desc = { en: 'Domestic hot water heating active' };
          break;
        case 'compressor':
          options.title = { en: 'Compressor Running' };
          options.desc = { en: 'Heat pump compressor is running' };
          break;
        case 'pump':
          options.title = { en: 'Pump Running' };
          options.desc = { en: 'Heating circuit pump is running' };
          break;
        case 'ventilation':
          options.title = { en: 'Ventilation Active' };
          options.desc = { en: 'Ventilation system is running' };
          break;
        case 'summer_mode':
          options.title = { en: 'Summer Mode' };
          options.desc = { en: 'Summer mode active (heating disabled)' };
          break;
        default:
          options.title = { en: `Status (${statusType})` };
      }
    }

    // Handle target temperature capabilities
    if (capability.startsWith('target_temperature.')) {
      const subType = capability.split('.')[1];
      switch (subType) {
        case 'hot_water':
          options.title = { en: 'Hot Water Target' };
          options.desc = { en: 'Domestic hot water target temperature' };
          break;
        case 'heating':
          options.title = { en: 'Heating Target' };
          options.desc = { en: 'Heating circuit target temperature' };
          break;
        case 'heating_2':
          options.title = { en: 'Heating 2 Target' };
          options.desc = { en: 'Second heating circuit target temperature' };
          break;
        default:
          options.title = { en: `Target Temperature (${subType})` };
      }
    }

    // Handle thermostat mode capabilities
    if (capability.startsWith('thermostat_mode.')) {
      const subType = capability.split('.')[1];
      switch (subType) {
        case 'hot_water':
          options.title = { en: 'Hot Water Mode' };
          options.desc = { en: 'Domestic hot water heating mode' };
          break;
        case 'heating':
          options.title = { en: 'Heating Mode' };
          options.desc = { en: 'Heating circuit mode' };
          break;
        case 'heating_2':
          options.title = { en: 'Heating 2 Mode' };
          options.desc = { en: 'Second heating circuit mode' };
          break;
        default:
          options.title = { en: `Thermostat Mode (${subType})` };
      }
    }

    // Generic capabilities without sub-types
    if (capability === 'measure_voltage') {
      options.title = { en: 'Motor Voltage' };
      options.desc = { en: 'Compressor motor voltage' };
    }

    if (capability === 'measure_signal_strength') {
      options.title = { en: 'WiFi Signal' };
      options.desc = { en: 'WiFi signal strength' };
    }

    // If no specific options found but we have entity name, use it
    if (!options.title && entityName) {
      options.title = { en: this.formatEntityName(entityName) };
    }

    return Object.keys(options).length > 0 ? options : undefined;
  }

  private formatEntityName(entityName: string): string {
    // Convert snake_case to Title Case
    return entityName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private updateSensorCapability(data: any) {
    const objectId = this.getObjectIdFromEntityKey(data.key);
    
    if (!objectId) {
      this.log(`No objectId found for sensor key: ${data.key} = ${data.state}`);
      return;
    }
    
    const capability = this.entityMappings.get(objectId);
    if (capability) {
      const options = this.getCapabilityOptions(capability, objectId);
      this.addCapabilityIfNeeded(capability, options).then(() => {
        this.setCapabilityValue(capability, data.state);
        this.log(`Updated sensor ${objectId} (${data.key}) -> ${capability}: ${data.state}`);
      });
    } else {
      this.log(`No mapping found for sensor: ${objectId} (${data.key}) = ${data.state}`);
    }
  }

  private updateBinarySensorCapability(data: any) {
    const objectId = this.getObjectIdFromEntityKey(data.key);
    
    if (!objectId) {
      this.log(`No objectId found for binary sensor key: ${data.key} = ${data.state}`);
      return;
    }
    
    const capability = this.entityMappings.get(objectId);
    if (capability) {
      const options = this.getCapabilityOptions(capability, objectId);
      this.addCapabilityIfNeeded(capability, options).then(() => {
        this.setCapabilityValue(capability, data.state);
        this.log(`Updated binary sensor ${objectId} (${data.key}) -> ${capability}: ${data.state}`);
      });
    } else {
      this.log(`No mapping found for binary sensor: ${objectId} (${data.key}) = ${data.state}`);
    }
  }

  private updateClimateCapability(data: any) {
    const objectId = this.getObjectIdFromEntityKey(data.key);
    
    if (!objectId) {
      this.log(`No objectId found for climate key: ${data.key}`);
      return;
    }
    
    // Handle different climate entities
    let targetCapability = 'target_temperature';
    let measureCapability = 'measure_temperature';
    let modeCapability = 'thermostat_mode';
    
    switch (objectId) {
      case 'heating_circuit_1':
        targetCapability = 'target_temperature';
        measureCapability = 'measure_temperature';
        modeCapability = 'thermostat_mode';
        break;
      case 'heating_circuit_2':
        targetCapability = 'target_temperature.heating_2';
        measureCapability = 'measure_temperature.heating_2';
        modeCapability = 'thermostat_mode.heating_2';
        break;
      case 'hot_water_circuit':
        targetCapability = 'target_temperature.hot_water';
        measureCapability = 'measure_temperature.hot_water';
        modeCapability = 'thermostat_mode.hot_water';
        break;
    }

    if (data.currentTemperature !== undefined) {
      const options = this.getCapabilityOptions(measureCapability, objectId);
      this.addCapabilityIfNeeded(measureCapability, options).then(() => {
        this.setCapabilityValue(measureCapability, data.currentTemperature);
      });
    }
    
    if (data.targetTemperature !== undefined) {
      const options = this.getCapabilityOptions(targetCapability, objectId);
      this.addCapabilityIfNeeded(targetCapability, options).then(() => {
        this.setCapabilityValue(targetCapability, data.targetTemperature);
      });
    }
    
    if (data.mode !== undefined) {
      const options = this.getCapabilityOptions(modeCapability, objectId);
      this.addCapabilityIfNeeded(modeCapability, options).then(() => {
        // Map ESPHome modes to Homey modes
        const modeMap: { [key: number]: string } = {
          0: 'off',
          1: 'auto',
          2: 'cool',
          3: 'heat',
          6: 'auto'
        };
        const homeyMode = modeMap[data.mode] || 'off';
        this.setCapabilityValue(modeCapability, homeyMode);
      });
    }

    this.log(`Updated climate ${objectId} (${data.key}):`, data);
  }

  private updateSwitchCapability(data: any) {
    const objectId = this.getObjectIdFromEntityKey(data.key);
    
    if (!objectId) {
      this.log(`No objectId found for switch key: ${data.key} = ${data.state}`);
      return;
    }
    
    const capability = this.entityMappings.get(objectId);
    if (capability) {
      this.addCapabilityIfNeeded(capability).then(() => {
        this.setCapabilityValue(capability, data.state);
        this.log(`Updated switch ${objectId} (${data.key}) -> ${capability}: ${data.state}`);
      });
    } else {
      // Fallback to generic onoff capability
      if (this.hasCapability('onoff')) {
        this.setCapabilityValue('onoff', data.state);
      }
      this.log(`Switch ${objectId} (${data.key}): ${data.state}`);
    }
  }

  private updateLightCapability(data: any) {
    const objectId = this.getObjectIdFromEntityKey(data.key);
    
    if (!objectId) {
      this.log(`No objectId found for light key: ${data.key}`);
      return;
    }
    
    if (this.hasCapability('onoff')) {
      this.setCapabilityValue('onoff', data.state);
    }
    if (data.brightness !== undefined && this.hasCapability('dim')) {
      this.setCapabilityValue('dim', data.brightness / 255);
    }
    this.log(`Updated light ${objectId} (${data.key}):`, data);
  }

  private updateTextSensorCapability(data: any) {
    const objectId = this.getObjectIdFromEntityKey(data.key);
    
    if (!objectId) {
      this.log(`No objectId found for text sensor key: ${data.key}`);
      return;
    }
    
    this.log(`Text sensor ${objectId} (${data.key}): ${data.state}`);
    // Store in device settings for later retrieval
    this.setSettings({ [`text_${objectId}`]: data.state }).catch(err => {
      this.log(`Failed to store text sensor value:`, err);
    });
  }

  private updateNumberCapability(data: any) {
    const objectId = this.getObjectIdFromEntityKey(data.key);
    
    if (!objectId) {
      this.log(`No objectId found for number key: ${data.key} = ${data.state}`);
      return;
    }
    
    const capability = this.entityMappings.get(objectId);
    if (capability) {
      this.addCapabilityIfNeeded(capability).then(() => {
        this.setCapabilityValue(capability, data.state);
        this.log(`Updated number ${objectId} (${data.key}) -> ${capability}: ${data.state}`);
      });
    } else {
      this.log(`No mapping found for number: ${objectId} (${data.key}) = ${data.state}`);
    }
  }

  private updateFanCapability(data: any) {
    const objectId = this.getObjectIdFromEntityKey(data.key);
    
    if (!objectId) {
      this.log(`No objectId found for fan key: ${data.key}`);
      return;
    }
    
    const capability = this.entityMappings.get(objectId);
    if (capability) {
      this.addCapabilityIfNeeded(capability).then(() => {
        // Map speed level to 0-1 range for fan speed capabilities
        const normalizedSpeed = data.speedLevel ? data.speedLevel / 100 : 0;
        this.setCapabilityValue(capability, normalizedSpeed);
        this.log(`Updated fan ${objectId} (${data.key}) -> ${capability}: ${normalizedSpeed}`);
      });
    } else {
      this.log(`Fan ${objectId} (${data.key}): state=${data.state}, speed=${data.speed}, level=${data.speedLevel}`);
    }
  }

  private updateSelectCapability(data: any) {
    const capability = this.entityMappings.get(data.key);
    if (capability) {
      this.addCapabilityIfNeeded(capability).then(() => {
        this.setCapabilityValue(capability, data.option || data.state);
        this.log(`Updated select ${data.key} -> ${capability}: ${data.option || data.state}`);
      });
    } else {
      this.log(`Select ${data.key}: ${data.option || data.state}`);
    }
  }

  private handleButtonPress(data: any) {
    this.log(`Button pressed: ${data.name} (${data.key})`);
    // Emit flow card trigger if available
    try {
      this.homey.flow.getDeviceTriggerCard('button_pressed')
        ?.trigger(this, { button_name: data.name, button_key: data.key })
        .catch(err => this.error('Failed to trigger button press flow:', err));
    } catch (err) {
      // Flow card might not be defined yet
      this.log('Button press flow card not available');
    }
  }

  private registerCapabilityListeners() {
    // Climate control listeners
    this.registerMultipleCapabilityListener(['target_temperature', 'target_temperature.heating_night', 'target_temperature.hot_water_day', 'target_temperature.hot_water_night'], async (values) => {
      if (!this.client) return;

      for (const [capability, value] of Object.entries(values)) {
        let climateEntityId = 'heating_day'; // default
        
        if (capability.includes('heating_night')) {
          climateEntityId = 'heating_night';
        } else if (capability.includes('hot_water_day')) {
          climateEntityId = 'hot_water_day';
        } else if (capability.includes('hot_water_night')) {
          climateEntityId = 'hot_water_night';
        }

        const climateKey = this.entityKeys.get(climateEntityId);
        if (climateKey !== undefined) {
          try {
            await this.client.setClimateTemperature(climateKey, value as number);
            this.log(`Set ${climateEntityId} temperature to ${value}`);
          } catch (error) {
            this.error(`Failed to set ${climateEntityId} temperature:`, error);
          }
        } else {
          this.log(`No key found for climate entity: ${climateEntityId}`);
        }
      }
    });

    // Thermostat mode listeners
    this.registerMultipleCapabilityListener(['thermostat_mode', 'thermostat_mode.heating_night', 'thermostat_mode.hot_water_day', 'thermostat_mode.hot_water_night'], async (values) => {
      if (!this.client) return;

      for (const [capability, value] of Object.entries(values)) {
        let climateEntityId = 'heating_day'; // default
        
        if (capability.includes('heating_night')) {
          climateEntityId = 'heating_night';
        } else if (capability.includes('hot_water_day')) {
          climateEntityId = 'hot_water_day';
        } else if (capability.includes('hot_water_night')) {
          climateEntityId = 'hot_water_night';
        }

        // Map Homey modes to ESPHome modes
        const modeMap: { [key: string]: number } = {
          'off': 0,
          'heat': 3,
          'cool': 2,
          'auto': 1
        };

        const espHomeMode = modeMap[value as string];
        const climateKey = this.entityKeys.get(climateEntityId);
        
        if (espHomeMode !== undefined && climateKey !== undefined) {
          try {
            await this.client.setClimateMode(climateKey, espHomeMode);
            this.log(`Set ${climateEntityId} mode to ${value}`);
          } catch (error) {
            this.error(`Failed to set ${climateEntityId} mode:`, error);
          }
        } else {
          this.log(`Invalid mode or missing key for ${climateEntityId}: mode=${value}, key=${climateKey}`);
        }
      }
    });

    // Switch control listeners
    this.registerMultipleCapabilityListener(['onoff', 'onoff.cooling', 'onoff.dhw_eco'], async (values) => {
      if (!this.client) return;

      for (const [capability, value] of Object.entries(values)) {
        let switchEntityId = 'main_switch'; // default
        
        if (capability.includes('cooling')) {
          switchEntityId = 'cooling_mode';
        } else if (capability.includes('dhw_eco')) {
          switchEntityId = 'dhw_eco';
        }

        const switchKey = this.entityKeys.get(switchEntityId);
        if (switchKey !== undefined) {
          try {
            await this.client.setSwitchState(switchKey, value as boolean);
            this.log(`Set ${switchEntityId} to ${value}`);
          } catch (error) {
            this.error(`Failed to set ${switchEntityId}:`, error);
          }
        } else {
          this.log(`No key found for switch entity: ${switchEntityId}`);
        }
      }
    });

    // Number control listeners - TODO: Add support to ESPHomeClient
    /* 
    const numberCapabilities = [
      'heating_curve.circuit_1', 
      'heating_curve.circuit_2', 
      'temperature_offset.room', 
      'temperature_offset.outside',
      'target_temperature.hot_water_manual'
    ];
    
    this.registerMultipleCapabilityListener(numberCapabilities, async (values) => {
      if (!this.client) return;

      for (const [capability, value] of Object.entries(values)) {
        // Reverse lookup in entity mappings
        let numberKey = '';
        for (const [entityKey, mappedCap] of this.entityMappings.entries()) {
          if (mappedCap === capability) {
            numberKey = entityKey;
            break;
          }
        }

        if (numberKey) {
          try {
            await this.client.setNumberValue(numberKey, value as number);
            this.log(`Set ${numberKey} to ${value}`);
          } catch (error) {
            this.error(`Failed to set ${numberKey}:`, error);
          }
        }
      }
    });
    */

    // Fan speed listeners - TODO: Add support to ESPHomeClient
    /*
    const fanCapabilities = ['fan_speed.vent_1', 'fan_speed.vent_2', 'fan_speed.vent_3'];
    this.registerMultipleCapabilityListener(fanCapabilities, async (values) => {
      if (!this.client) return;

      for (const [capability, value] of Object.entries(values)) {
        // Reverse lookup in entity mappings
        let fanKey = '';
        for (const [entityKey, mappedCap] of this.entityMappings.entries()) {
          if (mappedCap === capability) {
            fanKey = entityKey;
            break;
          }
        }

        if (fanKey) {
          try {
            // Convert 0-1 range back to 0-100 for ESP
            const speedLevel = Math.round((value as number) * 100);
            await this.client.setFanSpeed(fanKey, speedLevel);
            this.log(`Set ${fanKey} speed to ${speedLevel}%`);
          } catch (error) {
            this.error(`Failed to set ${fanKey} speed:`, error);
          }
        }
      }
    });
    */
  }

  async onDeleted() {
    if (this.client) {
      await this.client.disconnect();
    }
  }
}

module.exports = THZ504DeviceComprehensive;