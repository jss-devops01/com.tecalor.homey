import { EventEmitter } from 'events';
import { Client as NativeApiClient } from '@2colors/esphome-native-api';

export interface ESPHomeDeviceInfo {
  name: string;
  macAddress: string;
  esphomeVersion: string;
  model: string;
  friendlyName: string;
  manufacturer: string;
}

export interface ESPHomeSensor {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  unitOfMeasurement?: string;
  deviceClass?: string;
}

export interface ESPHomeClimate {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  supportedModes?: number[];
  visualMinTemperature?: number;
  visualMaxTemperature?: number;
}

export interface ESPHomeSwitch {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  deviceClass?: string;
}

export interface ESPHomeLight {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  supportsBrightness?: boolean;
  supportsColorTemperature?: boolean;
  supportsRgb?: boolean;
}

export interface ESPHomeBinarySensor {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  deviceClass?: string;
}

export interface ESPHomeTextSensor {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
}

export interface ESPHomeNumber {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
}

export interface ESPHomeFan {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  supportsDirection?: boolean;
  supportsOscillation?: boolean;
  supportsSpeed?: boolean;
  speedCount?: number;
}

export interface ESPHomeSelect {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  options?: string[];
}

export interface ESPHomeButton {
  key: number;
  objectId: string;
  name: string;
  uniqueId: string;
  icon?: string;
  deviceClass?: string;
}

export interface ESPHomeEntities {
  sensors: Map<number, ESPHomeSensor>;
  climates: Map<number, ESPHomeClimate>;
  switches: Map<number, ESPHomeSwitch>;
  lights: Map<number, ESPHomeLight>;
  binarySensors: Map<number, ESPHomeBinarySensor>;
  textSensors: Map<number, ESPHomeTextSensor>;
  numbers: Map<number, ESPHomeNumber>;
  fans: Map<number, ESPHomeFan>;
  selects: Map<number, ESPHomeSelect>;
  buttons: Map<number, ESPHomeButton>;
}

/**
 * ESPHome client using the proven @2colors/esphome-native-api library
 * This replaces our custom protocol implementation with a well-tested library
 * that handles all the complexities including Noise encryption.
 */
export class ESPHomeClient extends EventEmitter {
  private host: string;
  private port: number;
  private encryptionKey: string;
  private nativeClient: any = null;
  private connected = false;
  private authenticated = false;
  private entities: ESPHomeEntities = {
    sensors: new Map(),
    climates: new Map(),
    switches: new Map(),
    lights: new Map(),
    binarySensors: new Map(),
    textSensors: new Map(),
    numbers: new Map(),
    fans: new Map(),
    selects: new Map(),
    buttons: new Map(),
  };

  constructor(host: string, port: number, encryptionKey: string) {
    super();
    this.host = host;
    this.port = port;
    this.encryptionKey = encryptionKey;
  }

  async init(): Promise<void> {
    // Create native API client
    this.nativeClient = new NativeApiClient({
      host: this.host,
      port: this.port,
      encryptionKey: this.encryptionKey || undefined,
      password: undefined, // We use encryption key, not password
      initializeSubscribeLogs: false, // Disable logs for now
      initializeListEntities: true, // We want entity discovery
      reconnect: false, // We handle reconnection manually
      clientInfo: 'Homey Tecalor THZ-504 Client'
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.nativeClient.on('initialized', () => {
      this.connected = true;
      this.authenticated = true;
      
      // Emit device info
      const deviceInfo: ESPHomeDeviceInfo = {
        name: this.nativeClient.deviceInfo?.name || 'Unknown',
        macAddress: this.nativeClient.deviceInfo?.macAddress || '00:00:00:00:00:00',
        esphomeVersion: this.nativeClient.deviceInfo?.esphomeVersion || 'Unknown',
        model: this.nativeClient.deviceInfo?.model || 'Unknown',
        friendlyName: this.nativeClient.deviceInfo?.friendlyName || this.nativeClient.deviceInfo?.name || 'Unknown',
        manufacturer: this.nativeClient.deviceInfo?.manufacturer || 'Unknown'
      };
      
      this.emit('connected');
      this.emit('deviceInfo', deviceInfo);
      
      // Process existing entities
      this.processEntities();
    });

    this.nativeClient.on('disconnected', () => {
      this.connected = false;
      this.authenticated = false;
      this.emit('disconnected');
    });

    this.nativeClient.on('error', (error: any) => {
      this.emit('error', error);
    });

    this.nativeClient.on('newEntity', (entity: any) => {
      this.processNewEntity(entity);
    });
  }

  private processEntities(): void {
    // Process all existing entities
    const entities = this.nativeClient.entities;
    
    Object.values(entities).forEach((entity: any) => {
      this.processNewEntity(entity);
    });

    // Emit entities event after processing all
    this.emit('entities', this.entities);
  }

  private processNewEntity(entity: any): void {
    try {
      switch (entity.type) {
        case 'Sensor':
          const sensor: ESPHomeSensor = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            unitOfMeasurement: entity.unitOfMeasurement,
            deviceClass: entity.deviceClass
          };
          this.entities.sensors.set(entity.key, sensor);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            console.log(`Sensor state event for entity key ${entity.key} (objectId: ${entity.objectId}):`, state);
            this.emit('sensorState', {
              key: state.key, // Use key from state data, not entity
              state: state.state,
              missingState: state.missingState || false
            });
          });
          break;

        case 'Climate':
          const climate: ESPHomeClimate = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            supportedModes: entity.supportedModes,
            visualMinTemperature: entity.visualMinTemperature,
            visualMaxTemperature: entity.visualMaxTemperature
          };
          this.entities.climates.set(entity.key, climate);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            console.log(`Climate state event for entity key ${entity.key} (objectId: ${entity.objectId}):`, state);
            this.emit('climateState', {
              key: state.key, // Use key from state data, not entity
              mode: state.mode,
              currentTemperature: state.currentTemperature,
              targetTemperature: state.targetTemperature,
              action: state.action
            });
          });
          break;

        case 'Switch':
          const switchEntity: ESPHomeSwitch = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            deviceClass: entity.deviceClass
          };
          this.entities.switches.set(entity.key, switchEntity);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            this.emit('switchState', {
              key: state.key, // Use key from state data, not entity
              state: state.state
            });
          });
          break;

        case 'Light':
          const light: ESPHomeLight = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            supportsBrightness: entity.supportsBrightness || false,
            supportsColorTemperature: entity.supportsColorTemperature || false,
            supportsRgb: entity.supportsRgb || false
          };
          this.entities.lights.set(entity.key, light);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            console.log(`Light state event for entity key ${entity.key} (objectId: ${entity.objectId}):`, state);
            this.emit('lightState', {
              key: state.key, // Use key from state data, not entity
              state: state.state,
              brightness: state.brightness,
              red: state.red,
              green: state.green,
              blue: state.blue,
              colorTemperature: state.colorTemperature
            });
          });
          break;

        case 'BinarySensor':
          const binarySensor: ESPHomeBinarySensor = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            deviceClass: entity.deviceClass
          };
          this.entities.binarySensors.set(entity.key, binarySensor);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            this.emit('binarySensorState', {
              key: state.key, // Use key from state data, not entity
              state: state.state,
              missingState: state.missingState || false
            });
          });
          break;

        case 'TextSensor':
          const textSensor: ESPHomeTextSensor = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon
          };
          this.entities.textSensors.set(entity.key, textSensor);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            this.emit('textSensorState', {
              key: state.key, // Use key from state data, not entity
              state: state.state,
              missingState: state.missingState || false
            });
          });
          break;

        case 'Number':
          const number: ESPHomeNumber = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            minValue: entity.minValue,
            maxValue: entity.maxValue,
            step: entity.step
          };
          this.entities.numbers.set(entity.key, number);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            this.emit('numberState', {
              key: state.key, // Use key from state data, not entity
              state: state.state,
              missingState: state.missingState || false
            });
          });
          break;

        case 'Fan':
          const fan: ESPHomeFan = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            supportsDirection: entity.supportsDirection || false,
            supportsOscillation: entity.supportsOscillation || false,
            supportsSpeed: entity.supportsSpeed || false,
            speedCount: entity.speedCount || 0
          };
          this.entities.fans.set(entity.key, fan);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            this.emit('fanState', {
              key: state.key, // Use key from state data, not entity
              state: state.state,
              speed: state.speed,
              speedLevel: state.speedLevel,
              direction: state.direction,
              oscillation: state.oscillation
            });
          });
          break;

        case 'Select':
          const select: ESPHomeSelect = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            options: entity.options || []
          };
          this.entities.selects.set(entity.key, select);
          
          // Set up state listener
          entity.on('state', (state: any) => {
            this.emit('selectState', {
              key: state.key, // Use key from state data, not entity
              state: state.state,
              missingState: state.missingState || false
            });
          });
          break;

        case 'Button':
          const button: ESPHomeButton = {
            key: entity.key,
            objectId: entity.objectId || '',
            name: entity.name || '',
            uniqueId: entity.uniqueId || '',
            icon: entity.icon,
            deviceClass: entity.deviceClass
          };
          this.entities.buttons.set(entity.key, button);
          break;

        default:
          console.log(`Unknown entity type: ${entity.type} for entity: ${entity.name}`);
      }
    } catch (error) {
      console.warn('Error processing entity:', entity, error);
    }
  }

  async connect(): Promise<void> {
    if (!this.nativeClient) {
      throw new Error('Client not initialized. Call init() first.');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 30000);

      this.once('connected', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.nativeClient.connect();
    });
  }

  disconnect(): void {
    if (this.nativeClient) {
      this.nativeClient.disconnect();
    }
  }

  isConnected(): boolean {
    return this.connected && this.authenticated;
  }

  getEntities(): ESPHomeEntities {
    return this.entities;
  }

  // Climate control methods
  async setClimateTemperature(key: number, temperature: number): Promise<void> {
    const entity = Object.values(this.nativeClient.entities).find((e: any) => e.key === key && e.type === 'Climate') as any;
    if (!entity) {
      throw new Error(`Climate entity with key ${key} not found`);
    }
    
    return entity.setTargetTemperature(temperature);
  }

  async setClimateMode(key: number, mode: number): Promise<void> {
    const entity = Object.values(this.nativeClient.entities).find((e: any) => e.key === key && e.type === 'Climate') as any;
    if (!entity) {
      throw new Error(`Climate entity with key ${key} not found`);
    }
    
    return entity.setMode(mode);
  }

  // Switch control methods
  async setSwitchState(key: number, state: boolean): Promise<void> {
    const entity = Object.values(this.nativeClient.entities).find((e: any) => e.key === key && e.type === 'Switch') as any;
    if (!entity) {
      throw new Error(`Switch entity with key ${key} not found`);
    }
    
    return entity.setState(state);
  }

  // Light control methods (if needed)
  async setLightState(key: number, state: boolean, brightness?: number, red?: number, green?: number, blue?: number): Promise<void> {
    const entity = Object.values(this.nativeClient.entities).find((e: any) => e.key === key && e.type === 'Light') as any;
    if (!entity) {
      throw new Error(`Light entity with key ${key} not found`);
    }
    
    const command: any = { state };
    if (brightness !== undefined) command.brightness = brightness;
    if (red !== undefined) command.red = red;
    if (green !== undefined) command.green = green;
    if (blue !== undefined) command.blue = blue;
    
    return entity.command(command);
  }

  // Fan control methods
  async setFanSpeed(key: number, speed: number): Promise<void> {
    const entity = Object.values(this.nativeClient.entities).find((e: any) => e.key === key && e.type === 'Fan') as any;
    if (!entity) {
      throw new Error(`Fan entity with key ${key} not found`);
    }
    
    return entity.setSpeed(speed);
  }

  // Number control methods
  async setNumberValue(key: number, value: number): Promise<void> {
    const entity = Object.values(this.nativeClient.entities).find((e: any) => e.key === key && e.type === 'Number') as any;
    if (!entity) {
      throw new Error(`Number entity with key ${key} not found`);
    }
    
    return entity.setState(value);
  }

  // Select control methods
  async setSelectOption(key: number, option: string): Promise<void> {
    const entity = Object.values(this.nativeClient.entities).find((e: any) => e.key === key && e.type === 'Select') as any;
    if (!entity) {
      throw new Error(`Select entity with key ${key} not found`);
    }
    
    return entity.setState(option);
  }

  // Button press methods
  async pressButton(key: number): Promise<void> {
    const entity = Object.values(this.nativeClient.entities).find((e: any) => e.key === key && e.type === 'Button') as any;
    if (!entity) {
      throw new Error(`Button entity with key ${key} not found`);
    }
    
    return entity.press();
  }
}
