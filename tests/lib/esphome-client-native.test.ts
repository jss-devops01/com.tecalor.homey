/// <reference types="jest" />/// <reference types="jest" />/// <reference types="jest" />/// <reference types="jest" />import { ESPHomeClient } from '../../lib/esphome-client-native';



import { ESPHomeClient } from '../../lib/esphome-client-native';



// Mock the @2colors/esphome-native-api moduleimport { ESPHomeClient } from '../../lib/esphome-client-native';

const mockNativeClient = {

  connect: jest.fn(),

  disconnect: jest.fn(),

  deviceInfo: jest.fn(),// Mock the @2colors/esphome-native-api moduleimport { ESPHomeClient } from '../../lib/esphome-client-native';import { createHomeyMocks } from '../mocks/homey-mocks';

  listEntities: jest.fn(),

  subscribeStates: jest.fn(),const mockNativeClient = {

  climateCommandService: jest.fn(),

  switchCommandService: jest.fn(),  connect: jest.fn(),

  lightCommandService: jest.fn(),

  on: jest.fn(),  disconnect: jest.fn(),

  off: jest.fn(),

  once: jest.fn(),  deviceInfo: jest.fn(),// Mock the @2colors/esphome-native-api moduleimport { ESPHomeClient, ESPHomeEntities, ESPHomeDeviceInfo } from '../../lib/esphome-client-native';

  emit: jest.fn(),

  connected: false,  listEntities: jest.fn(),

  destroyed: false,

  entities: {}  subscribeStates: jest.fn(),jest.mock('@2colors/esphome-native-api', () => {

};

  climateCommandService: jest.fn(),

const MockClientConstructor = jest.fn().mockImplementation(() => mockNativeClient);

  switchCommandService: jest.fn(),  const MockClient = jest.fn().mockImplementation(() => ({// Mock the @2colors/esphome-native-api module

jest.mock('@2colors/esphome-native-api', () => ({

  EsphomeNativeApiClient: MockClientConstructor  lightCommandService: jest.fn(),

}));

  on: jest.fn(),    on: jest.fn(),

describe('ESPHomeClient (Native API)', () => {

  let client: ESPHomeClient;  off: jest.fn(),

  

  const mockDeviceInfo = {  once: jest.fn(),    connect: jest.fn(),// Mock the @2colors/esphome-native-api modulejest.mock('@2colors/esphome-native-api', () => ({

    name: 'Test THZ-504',

    macAddress: '00:11:22:33:44:55',  emit: jest.fn(),

    esphomeVersion: '2023.1.0',

    model: 'ESP32-C6',  connected: false,    disconnect: jest.fn(),

    friendlyName: 'Test THZ-504',

    manufacturer: 'Tecalor'  destroyed: false,

  };

  entities: {}    deviceInfo: {jest.mock('@2colors/esphome-native-api', () => {  EsphomeNativeApiClient: jest.fn().mockImplementation(() => ({

  beforeEach(() => {

    jest.clearAllMocks();};

    MockClientConstructor.mockClear();

          name: 'Test Device',

    // Reset mock client state

    mockNativeClient.connected = false;const MockClientConstructor = jest.fn().mockImplementation(() => mockNativeClient);

    mockNativeClient.destroyed = false;

    mockNativeClient.entities = {};      macAddress: '00:11:22:33:44:55',  const MockClient = jest.fn().mockImplementation(() => ({    connect: jest.fn(),

  });

jest.mock('@2colors/esphome-native-api', () => ({

  afterEach(() => {

    if (client) {  EsphomeNativeApiClient: MockClientConstructor      esphomeVersion: '2023.1.0',

      client.disconnect();

    }}));

  });

      model: 'ESP32-C6'    on: jest.fn(),    disconnect: jest.fn(),

  describe('Constructor and Initialization', () => {

    it('should create client with required parameters', () => {describe('ESPHomeClient (Native API)', () => {

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

        let client: ESPHomeClient;    },

      expect(client).toBeInstanceOf(ESPHomeClient);

      expect(client.isConnected()).toBe(false);  

    });

  const mockDeviceInfo = {    entities: {}    connect: jest.fn(),    deviceInfo: jest.fn(),

    it('should initialize native client on init()', async () => {

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');    name: 'Test THZ-504',

      

      const { EsphomeNativeApiClient } = require('@2colors/esphome-native-api');    macAddress: '00:11:22:33:44:55',  }));

      

      await client.init();    esphomeVersion: '2023.1.0',

      

      expect(EsphomeNativeApiClient).toHaveBeenCalledWith({    model: 'ESP32-C6',    disconnect: jest.fn(),    listEntities: jest.fn(),

        host: '192.168.1.100',

        port: 6053,    friendlyName: 'Test THZ-504',

        encryptionKey: 'test-encryption-key',

        password: undefined,    manufacturer: 'Tecalor'  return {

        clientInfo: 'Homey Tecalor THZ-504 Client',

        connectTimeout: 10000  };

      });

    });    Client: MockClient    deviceInfo: {    subscribeStates: jest.fn(),



    it('should throw error for missing encryption key', () => {  beforeEach(() => {

      expect(() => {

        // @ts-ignore - testing invalid parameters    jest.clearAllMocks();  };

        new ESPHomeClient('192.168.1.100', 6053);

      }).toThrow();    MockClientConstructor.mockClear();

    });

  });    });      name: 'Test Device',    subscribeToStates: jest.fn(),



  describe('Connection Management', () => {    // Reset mock client state

    beforeEach(async () => {

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');    mockNativeClient.connected = false;

      await client.init();

      mockNativeClient.connect.mockResolvedValue(undefined);    mockNativeClient.destroyed = false;

    });

    mockNativeClient.entities = {};describe('ESPHomeClient (Native API)', () => {      macAddress: '00:11:22:33:44:55',    on: jest.fn(),

    it('should connect successfully', async () => {

      const connectPromise = client.connect();  });

      

      // Simulate initialization event  let client: ESPHomeClient;

      const initCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'initialized')?.[1];

      if (initCallback) {  afterEach(() => {

        initCallback();

      }    if (client) {      esphomeVersion: '2023.1.0',    off: jest.fn(),

      

      await connectPromise;      client.disconnect();

      

      expect(mockNativeClient.connect).toHaveBeenCalled();    }  beforeEach(() => {

      expect(client.isConnected()).toBe(true);

    });  });



    it('should handle connection errors', async () => {    jest.clearAllMocks();      model: 'ESP32-C6',    once: jest.fn(),

      const error = new Error('Connection failed');

      mockNativeClient.connect.mockRejectedValue(error);  describe('Constructor and Initialization', () => {

      

      const connectPromise = client.connect();    it('should create client with required parameters', () => {    client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      

      // Simulate error event      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      const errorCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'error')?.[1];

      if (errorCallback) {        });      friendlyName: 'Test THZ-504',    emit: jest.fn(),

        errorCallback(error);

      }      expect(client).toBeInstanceOf(ESPHomeClient);

      

      await expect(connectPromise).rejects.toThrow('Connection failed');      expect(client.isConnected()).toBe(false);

    });

    });

    it('should disconnect from device', async () => {

      mockNativeClient.disconnect.mockResolvedValue(undefined);  afterEach(() => {      manufacturer: 'Tecalor'    climateCommandService: jest.fn(),

      

      client.disconnect();    it('should initialize native client on init()', async () => {

      

      expect(mockNativeClient.disconnect).toHaveBeenCalled();      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');    if (client) {

    });

      

    it('should track connection state', () => {

      mockNativeClient.connected = true;      const { EsphomeNativeApiClient } = require('@2colors/esphome-native-api');      client.disconnect();    },    switchCommandService: jest.fn(),

      expect(client.isConnected()).toBe(true);

            

      mockNativeClient.connected = false;

      expect(client.isConnected()).toBe(false);      await client.init();    }

    });

      

    it('should handle disconnection events', async () => {

      // Simulate initialization first      expect(EsphomeNativeApiClient).toHaveBeenCalledWith({  });    entities: {}    connected: false,

      const initCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'initialized')?.[1];

      if (initCallback) {        host: '192.168.1.100',

        initCallback();

      }        port: 6053,

      

      // Simulate disconnection        encryptionKey: 'test-encryption-key',

      const disconnectCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'disconnected')?.[1];

      if (disconnectCallback) {        password: undefined,  it('should create client with required parameters', () => {  }));    destroyed: false

        disconnectCallback();

      }        clientInfo: 'Homey Tecalor THZ-504 Client',

      

      expect(client.isConnected()).toBe(false);        connectTimeout: 10000    expect(client).toBeInstanceOf(ESPHomeClient);

    });

  });      });



  describe('Device Info', () => {    });    expect(client.isConnected()).toBe(false);  }))

    beforeEach(async () => {

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();

    });    it('should throw error for missing encryption key', () => {  });



    it('should request device info', async () => {      expect(() => {

      mockNativeClient.deviceInfo.mockResolvedValue(mockDeviceInfo);

              // @ts-ignore - testing invalid parameters  return {}));

      const deviceInfo = await client.getDeviceInfo();

              new ESPHomeClient('192.168.1.100', 6053);

      expect(mockNativeClient.deviceInfo).toHaveBeenCalled();

      expect(deviceInfo).toEqual(mockDeviceInfo);      }).toThrow();  it('should initialize and connect', async () => {

    });

  });    });



  describe('Entity Management', () => {  });    await client.init();    Client: MockClient

    beforeEach(async () => {

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();

    });  describe('Connection Management', () => {    



    it('should return empty entities initially', () => {    beforeEach(async () => {

      const entities = client.getEntities();

            client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');    // Get the mock instance  };describe('ESPHomeClient Native API Wrapper', () => {

      expect(entities).toEqual({

        sensors: new Map(),      await client.init();

        climates: new Map(),

        switches: new Map(),      mockNativeClient.connect.mockResolvedValue(undefined);    const { Client: MockClientConstructor } = require('@2colors/esphome-native-api');

        lights: new Map()

      });    });

    });

    const mockInstance = MockClientConstructor.mock.instances[0];});  let client: ESPHomeClient;

    it('should list entities', async () => {

      const mockEntities = [    it('should connect successfully', async () => {

        { objectId: 'sensor1', key: 1, name: 'Temperature' },

        { objectId: 'climate1', key: 2, name: 'Thermostat' }      const connectPromise = client.connect();    

      ];

            

      mockNativeClient.listEntities.mockResolvedValue(mockEntities);

            // Simulate initialization event    // Start connection  let mockNativeClient: any;

      const entities = await client.listEntities();

            const initCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'initialized')?.[1];

      expect(mockNativeClient.listEntities).toHaveBeenCalled();

      expect(entities).toEqual(mockEntities);      if (initCallback) {    const connectPromise = client.connect();

    });

  });        initCallback();



  describe('Climate Control', () => {      }    describe('ESPHomeClient (Native API)', () => {  let originalConsole: any;

    beforeEach(async () => {

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');      

      await client.init();

            await connectPromise;    // Simulate the initialized event

      // Mock climate entity

      mockNativeClient.entities = {      

        1: {

          key: 1,      expect(mockNativeClient.connect).toHaveBeenCalled();    const initCallback = mockInstance.on.mock.calls.find((call: any) => call[0] === 'initialized')?.[1];  let client: ESPHomeClient;

          type: 'Climate',

          setTargetTemperature: jest.fn(),      expect(client.isConnected()).toBe(true);

          setMode: jest.fn()

        }    });    if (initCallback) {

      };

    });



    it('should set climate temperature', async () => {    it('should handle connection errors', async () => {      initCallback();  let mockNativeClient: any;  beforeAll(() => {

      await client.setClimateTemperature(1, 22.0);

            const error = new Error('Connection failed');

      expect(mockNativeClient.entities[1].setTargetTemperature).toHaveBeenCalledWith(22.0);

    });      mockNativeClient.connect.mockRejectedValue(error);    }



    it('should set climate mode', async () => {      

      await client.setClimateMode(1, 2);

            const connectPromise = client.connect();        createHomeyMocks();

      expect(mockNativeClient.entities[1].setMode).toHaveBeenCalledWith(2);

    });      



    it('should throw error for unknown climate entity', async () => {      // Simulate error event    await connectPromise;

      await expect(client.setClimateTemperature(999, 22.0)).rejects.toThrow('Climate entity with key 999 not found');

    });      const errorCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'error')?.[1];

  });

      if (errorCallback) {    expect(client.isConnected()).toBe(true);  beforeEach(() => {    // Mock console to reduce noise in tests

  describe('Switch Control', () => {

    beforeEach(async () => {        errorCallback(error);

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();      }  });

      

      // Mock switch entity      

      mockNativeClient.entities = {

        2: {      await expect(connectPromise).rejects.toThrow('Connection failed');    // Clear all mocks    originalConsole = { ...console };

          key: 2,

          type: 'Switch',    });

          setState: jest.fn()

        }  it('should return empty entities initially', () => {

      };

    });    it('should disconnect from device', async () => {



    it('should set switch state', async () => {      mockNativeClient.disconnect.mockResolvedValue(undefined);    const entities = client.getEntities();    jest.clearAllMocks();    console.log = jest.fn();

      await client.setSwitchState(2, true);

            

      expect(mockNativeClient.entities[2].setState).toHaveBeenCalledWith(true);

    });      client.disconnect();    expect(entities.sensors).toBeInstanceOf(Map);



    it('should throw error for unknown switch entity', async () => {      

      await expect(client.setSwitchState(999, true)).rejects.toThrow('Switch entity with key 999 not found');

    });      expect(mockNativeClient.disconnect).toHaveBeenCalled();    expect(entities.climates).toBeInstanceOf(Map);        console.error = jest.fn();

  });

    });

  describe('Light Control', () => {

    beforeEach(async () => {    expect(entities.switches).toBeInstanceOf(Map);

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();    it('should track connection state', () => {

      

      // Mock light entity      mockNativeClient.connected = true;    expect(entities.sensors.size).toBe(0);    // Create client instance    console.warn = jest.fn();

      mockNativeClient.entities = {

        3: {      expect(client.isConnected()).toBe(true);

          key: 3,

          type: 'Light',        });

          command: jest.fn()

        }      mockNativeClient.connected = false;

      };

    });      expect(client.isConnected()).toBe(false);});    client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');  });



    it('should set light state', async () => {    });

      await client.setLightState(3, {

        state: true,    

        brightness: 255,

        red: 255,    it('should handle disconnection events', async () => {

        green: 0,

        blue: 0      // Simulate initialization first    // Get the mock native client instance after init  afterAll(() => {

      });

            const initCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'initialized')?.[1];

      expect(mockNativeClient.entities[3].command).toHaveBeenCalledWith({

        state: true,      if (initCallback) {    mockNativeClient = null;    Object.assign(console, originalConsole);

        brightness: 255,

        red: 255,        initCallback();

        green: 0,

        blue: 0      }  });  });

      });

    });      

  });

      // Simulate disconnection

  describe('State Subscriptions', () => {

    beforeEach(async () => {      const disconnectCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'disconnected')?.[1];

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();      if (disconnectCallback) {  afterEach(async () => {  beforeEach(async () => {

    });

        disconnectCallback();

    it('should subscribe to state updates', async () => {

      mockNativeClient.subscribeStates.mockResolvedValue(undefined);      }    if (client) {    // Clear all mocks

      

      await client.subscribeToStates();      

      

      expect(mockNativeClient.subscribeStates).toHaveBeenCalled();      expect(client.isConnected()).toBe(false);      client.disconnect();    jest.clearAllMocks();

    });

    });

    it('should handle subscription errors', async () => {

      const error = new Error('Subscription failed');  });    }    

      mockNativeClient.subscribeStates.mockRejectedValue(error);

      

      await expect(client.subscribeToStates()).rejects.toThrow('Subscription failed');

    });  describe('Device Info', () => {  });    const { EsphomeNativeApiClient } = require('@2colors/esphome-native-api');

  });

    beforeEach(async () => {

  describe('Event Handling', () => {

    beforeEach(async () => {      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');    mockNativeClient = new EsphomeNativeApiClient();

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();      await client.init();

    });

    });  describe('Constructor and Initialization', () => {    EsphomeNativeApiClient.mockReturnValue(mockNativeClient);

    it('should handle error events', () => {

      const errorCallback = mockNativeClient.on.mock.calls.find(call => call[0] === 'error')?.[1];

      const error = new Error('Test error');

          it('should request device info', async () => {    it('should create client with required parameters', () => {    

      expect(errorCallback).toBeDefined();

      if (errorCallback) {      mockNativeClient.deviceInfo.mockResolvedValue(mockDeviceInfo);

        errorCallback(error);

      }            expect(client).toBeInstanceOf(ESPHomeClient);    client = new ESPHomeClient('192.168.1.100', 6053, 'base64key');

    });

      const deviceInfo = await client.getDeviceInfo();

    it('should handle disconnection events', () => {

      const disconnectCallback = mockNativeClient.on.mock.calls.find(call => call[0] === 'disconnected')?.[1];            expect(client.isConnected()).toBe(false);  });

      

      expect(disconnectCallback).toBeDefined();      expect(mockNativeClient.deviceInfo).toHaveBeenCalled();

      if (disconnectCallback) {

        disconnectCallback();      expect(deviceInfo).toEqual(mockDeviceInfo);    });

      }

          });

      expect(client.isConnected()).toBe(false);

    });  });  afterEach(async () => {



    it('should handle cleanup on destruction', () => {

      mockNativeClient.disconnect.mockResolvedValue(undefined);

        describe('Entity Management', () => {    it('should require encryption key', () => {    if (client) {

      client.disconnect();

          beforeEach(async () => {

      expect(mockNativeClient.disconnect).toHaveBeenCalled();

    });      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');      expect(() => {      await client.disconnect();

  });

});      await client.init();

    });        // @ts-expect-error Testing missing required parameter    }



    it('should return empty entities initially', () => {        new ESPHomeClient('192.168.1.100', 6053);  });

      const entities = client.getEntities();

            }).toThrow();

      expect(entities).toEqual({

        sensors: new Map(),    });  describe('Initialization', () => {

        climates: new Map(),

        switches: new Map(),    it('should create ESPHomeClient instance', () => {

        lights: new Map()

      });    it('should initialize native client on init()', async () => {      expect(client).toBeDefined();

    });

      await client.init();      expect(client.host).toBe('192.168.1.100');

    it('should list entities', async () => {

      const mockEntities = [            expect(client.port).toBe(6053);

        { objectId: 'sensor1', key: 1, name: 'Temperature' },

        { objectId: 'climate1', key: 2, name: 'Thermostat' }      // Native client should be created    });

      ];

            const { Client: MockClientConstructor } = require('@2colors/esphome-native-api');

      mockNativeClient.listEntities.mockResolvedValue(mockEntities);

            expect(MockClientConstructor).toHaveBeenCalledWith({    it('should initialize native client on init()', async () => {

      const entities = await client.listEntities();

              host: '192.168.1.100',      await client.init();

      expect(mockNativeClient.listEntities).toHaveBeenCalled();

      expect(entities).toEqual(mockEntities);        port: 6053,      

    });

  });        encryptionKey: 'test-encryption-key',      const { EsphomeNativeApiClient } = require('@2colors/esphome-native-api');



  describe('Climate Control', () => {        password: undefined,      expect(EsphomeNativeApiClient).toHaveBeenCalledWith({

    beforeEach(async () => {

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');        initializeSubscribeLogs: false,        host: '192.168.1.100',

      await client.init();

              initializeListEntities: true,        port: 6053,

      // Mock climate entity

      mockNativeClient.entities = {        reconnect: false,        encryptionKey: 'base64key',

        1: {

          key: 1,        clientInfo: 'Homey Tecalor THZ-504 Client'        clientInfo: 'Homey THZ-504',

          type: 'Climate',

          setTargetTemperature: jest.fn(),      });        connectTimeout: 10000

          setMode: jest.fn()

        }    });      });

      };

    });  });    });



    it('should set climate temperature', async () => {

      await client.setClimateTemperature(1, 22.0);

        describe('Connection Management', () => {    it('should handle init without encryption key', async () => {

      expect(mockNativeClient.entities[1].setTargetTemperature).toHaveBeenCalledWith(22.0);

    });    beforeEach(async () => {      const clientNoKey = new ESPHomeClient('192.168.1.100', 6053);



    it('should set climate mode', async () => {      await client.init();      await clientNoKey.init();

      await client.setClimateMode(1, 2);

            // Get the mock instance that was created      

      expect(mockNativeClient.entities[1].setMode).toHaveBeenCalledWith(2);

    });      const { Client: MockClientConstructor } = require('@2colors/esphome-native-api');      const { EsphomeNativeApiClient } = require('@2colors/esphome-native-api');



    it('should throw error for unknown climate entity', async () => {      mockNativeClient = MockClientConstructor.mock.instances[MockClientConstructor.mock.instances.length - 1];      expect(EsphomeNativeApiClient).toHaveBeenCalledWith({

      await expect(client.setClimateTemperature(999, 22.0)).rejects.toThrow('Climate entity with key 999 not found');

    });    });        host: '192.168.1.100',

  });

        port: 6053,

  describe('Switch Control', () => {

    beforeEach(async () => {    it('should connect successfully', async () => {        encryptionKey: undefined,

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();      // Mock successful connection        clientInfo: 'Homey THZ-504',

      

      // Mock switch entity      const connectPromise = client.connect();        connectTimeout: 10000

      mockNativeClient.entities = {

        2: {            });

          key: 2,

          type: 'Switch',      // Simulate initialized event    });

          setState: jest.fn()

        }      const initCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'initialized')?.[1];  });

      };

    });      if (initCallback) {



    it('should set switch state', async () => {        initCallback();  describe('Connection Management', () => {

      await client.setSwitchState(2, true);

            }    beforeEach(async () => {

      expect(mockNativeClient.entities[2].setState).toHaveBeenCalledWith(true);

    });            await client.init();



    it('should throw error for unknown switch entity', async () => {      await connectPromise;    });

      await expect(client.setSwitchState(999, true)).rejects.toThrow('Switch entity with key 999 not found');

    });      

  });

      expect(client.isConnected()).toBe(true);    it('should connect to device', async () => {

  describe('Light Control', () => {

    beforeEach(async () => {      expect(mockNativeClient.connect).toHaveBeenCalled();      mockNativeClient.connect.mockResolvedValue(undefined);

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();    });      

      

      // Mock light entity      await client.connect();

      mockNativeClient.entities = {

        3: {    it('should handle connection errors', async () => {      

          key: 3,

          type: 'Light',      const connectPromise = client.connect();      expect(mockNativeClient.connect).toHaveBeenCalled();

          command: jest.fn()

        }          });

      };

    });      // Simulate error event



    it('should set light state', async () => {      const errorCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'error')?.[1];    it('should disconnect from device', async () => {

      await client.setLightState(3, {

        state: true,      if (errorCallback) {      mockNativeClient.disconnect.mockResolvedValue(undefined);

        brightness: 255,

        red: 255,        errorCallback(new Error('Connection failed'));      

        green: 0,

        blue: 0      }      await client.disconnect();

      });

                  

      expect(mockNativeClient.entities[3].command).toHaveBeenCalledWith({

        state: true,      await expect(connectPromise).rejects.toThrow('Connection failed');      expect(mockNativeClient.disconnect).toHaveBeenCalled();

        brightness: 255,

        red: 255,    });    });

        green: 0,

        blue: 0

      });

    });    it('should disconnect properly', () => {    it('should report connection status', async () => {

  });

      client.disconnect();      mockNativeClient.connected = true;

  describe('State Subscriptions', () => {

    beforeEach(async () => {      expect(mockNativeClient.disconnect).toHaveBeenCalled();      expect(client.isConnected()).toBe(true);

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();    });      

    });

      mockNativeClient.connected = false;

    it('should subscribe to state updates', async () => {

      mockNativeClient.subscribeStates.mockResolvedValue(undefined);    it('should handle disconnection events', async () => {      expect(client.isConnected()).toBe(false);

      

      await client.subscribeToStates();      await client.init();    });

      

      expect(mockNativeClient.subscribeStates).toHaveBeenCalled();      

    });

      // Simulate connection first    it('should handle connection errors', async () => {

    it('should handle subscription errors', async () => {

      const error = new Error('Subscription failed');      const connectPromise = client.connect();      const error = new Error('Connection failed');

      mockNativeClient.subscribeStates.mockRejectedValue(error);

            const initCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'initialized')?.[1];      mockNativeClient.connect.mockRejectedValue(error);

      await expect(client.subscribeToStates()).rejects.toThrow('Subscription failed');

    });      if (initCallback) {      

  });

        initCallback();      await expect(client.connect()).rejects.toThrow('Connection failed');

  describe('Event Handling', () => {

    beforeEach(async () => {      }    });

      client = new ESPHomeClient('192.168.1.100', 6053, 'test-encryption-key');

      await client.init();      await connectPromise;  });

    });

      

    it('should handle error events', () => {

      const errorCallback = mockNativeClient.on.mock.calls.find(call => call[0] === 'error')?.[1];      expect(client.isConnected()).toBe(true);  describe('Device Information', () => {

      const error = new Error('Test error');

                beforeEach(async () => {

      expect(errorCallback).toBeDefined();

      if (errorCallback) {      // Simulate disconnection      await client.init();

        errorCallback(error);

      }      const disconnectCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'disconnected')?.[1];    });

    });

      if (disconnectCallback) {

    it('should handle disconnection events', () => {

      const disconnectCallback = mockNativeClient.on.mock.calls.find(call => call[0] === 'disconnected')?.[1];        disconnectCallback();    it('should request device info', async () => {

      

      expect(disconnectCallback).toBeDefined();      }      const mockDeviceInfo = { name: 'THZ-504', version: '1.0.0' };

      if (disconnectCallback) {

        disconnectCallback();            mockNativeClient.deviceInfo.mockResolvedValue(mockDeviceInfo);

      }

            expect(client.isConnected()).toBe(false);      

      expect(client.isConnected()).toBe(false);

    });    });      const deviceInfo = await client.getDeviceInfo();



    it('should handle cleanup on destruction', () => {  });      

      mockNativeClient.disconnect.mockResolvedValue(undefined);

            expect(mockNativeClient.deviceInfo).toHaveBeenCalled();

      client.disconnect();

        describe('Entity Management', () => {      expect(deviceInfo).toEqual(mockDeviceInfo);

      expect(mockNativeClient.disconnect).toHaveBeenCalled();

    });    beforeEach(async () => {    });

  });

});      await client.init();

      mockNativeClient = require('@2colors/esphome-native-api').Client.mock.instances.slice(-1)[0];    it('should list entities', async () => {

    });      const mockEntities = [

        { objectId: 'sensor1', key: 1, name: 'Temperature' },

    it('should return empty entities initially', () => {        { objectId: 'climate1', key: 2, name: 'Thermostat' }

      const entities = client.getEntities();      ];

      expect(entities).toEqual({      mockNativeClient.listEntities.mockResolvedValue(mockEntities);

        sensors: new Map(),      

        climates: new Map(),      const entities = await client.listEntities();

        switches: new Map()      

      });      expect(mockNativeClient.listEntities).toHaveBeenCalled();

    });      expect(entities).toEqual(mockEntities);

    });

    it('should emit entities event on initialization', (done) => {  });

      client.once('entities', (entities: ESPHomeEntities) => {

        expect(entities).toBeDefined();  describe('Event Handling', () => {

        expect(entities.sensors).toBeInstanceOf(Map);    beforeEach(async () => {

        expect(entities.climates).toBeInstanceOf(Map);      await client.init();

        expect(entities.switches).toBeInstanceOf(Map);    });

        done();

      });    it('should register event listeners', () => {

      const mockCallback = jest.fn();

      // Trigger initialization      

      const connectPromise = client.connect();      client.on('deviceInfo', mockCallback);

      const initCallback = mockNativeClient.on.mock.calls.find((call: any) => call[0] === 'initialized')?.[1];      

      if (initCallback) {      expect(mockNativeClient.on).toHaveBeenCalledWith('deviceInfo', mockCallback);

        initCallback();    });

      }

    });    it('should remove event listeners', () => {

  });      const mockCallback = jest.fn();

      

  describe('Climate Control', () => {      client.off('deviceInfo', mockCallback);

    beforeEach(async () => {      

      await client.init();      expect(mockNativeClient.off).toHaveBeenCalledWith('deviceInfo', mockCallback);

      mockNativeClient = require('@2colors/esphome-native-api').Client.mock.instances.slice(-1)[0];    });

      

      // Mock entities with a climate entity    it('should register one-time event listeners', () => {

      mockNativeClient.entities = {      const mockCallback = jest.fn();

        1: {      

          key: 1,      client.once('deviceInfo', mockCallback);

          type: 'Climate',      

          setTargetTemperature: jest.fn(),      expect(mockNativeClient.once).toHaveBeenCalledWith('deviceInfo', mockCallback);

          setMode: jest.fn()    });

        }

      };    it('should emit events', () => {

    });      client.emit('test', 'data');

      

    it('should set climate temperature', async () => {      expect(mockNativeClient.emit).toHaveBeenCalledWith('test', 'data');

      await expect(client.setClimateTemperature(1, 22.0)).resolves.not.toThrow();    });

      expect(mockNativeClient.entities[1].setTargetTemperature).toHaveBeenCalledWith(22.0);  });

    });

  describe('Climate Control', () => {

    it('should set climate mode', async () => {    beforeEach(async () => {

      await expect(client.setClimateMode(1, 1)).resolves.not.toThrow();      await client.init();

      expect(mockNativeClient.entities[1].setMode).toHaveBeenCalledWith(1);    });

    });

    it('should set climate temperature', async () => {

    it('should throw error for unknown climate entity', async () => {      mockNativeClient.climateCommandService.mockResolvedValue(undefined);

      await expect(client.setClimateTemperature(999, 22.0)).rejects.toThrow('Climate entity with key 999 not found');      

    });      await client.setClimateTemperature(1, 22.5);

  });      

      expect(mockNativeClient.climateCommandService).toHaveBeenCalledWith({

  describe('Switch Control', () => {        key: 1,

    beforeEach(async () => {        hasTargetTemperature: true,

      await client.init();        targetTemperature: 22.5

      mockNativeClient = require('@2colors/esphome-native-api').Client.mock.instances.slice(-1)[0];      });

          });

      // Mock entities with a switch entity

      mockNativeClient.entities = {    it('should set climate mode', async () => {

        2: {      mockNativeClient.climateCommandService.mockResolvedValue(undefined);

          key: 2,      

          type: 'Switch',      await client.setClimateMode(1, 2);

          setState: jest.fn()      

        }      expect(mockNativeClient.climateCommandService).toHaveBeenCalledWith({

      };        key: 1,

    });        hasMode: true,

        mode: 2

    it('should set switch state', async () => {      });

      await expect(client.setSwitchState(2, true)).resolves.not.toThrow();    });

      expect(mockNativeClient.entities[2].setState).toHaveBeenCalledWith(true);

    });    it('should handle climate command errors', async () => {

      const error = new Error('Climate command failed');

    it('should throw error for unknown switch entity', async () => {      mockNativeClient.climateCommandService.mockRejectedValue(error);

      await expect(client.setSwitchState(999, true)).rejects.toThrow('Switch entity with key 999 not found');      

    });      await expect(client.setClimateTemperature(1, 22.5)).rejects.toThrow('Climate command failed');

  });    });

  });

  describe('Light Control', () => {

    beforeEach(async () => {  describe('Switch Control', () => {

      await client.init();    beforeEach(async () => {

      mockNativeClient = require('@2colors/esphome-native-api').Client.mock.instances.slice(-1)[0];      await client.init();

          });

      // Mock entities with a light entity

      mockNativeClient.entities = {    it('should set switch state', async () => {

        3: {      mockNativeClient.switchCommandService.mockResolvedValue(undefined);

          key: 3,      

          type: 'Light',      await client.setSwitchState(1, true);

          command: jest.fn()      

        }      expect(mockNativeClient.switchCommandService).toHaveBeenCalledWith({

      };        key: 1,

    });        state: true

      });

    it('should set light state with brightness and color', async () => {    });

      await expect(client.setLightState(3, true, 255, 255, 0, 0)).resolves.not.toThrow();

      expect(mockNativeClient.entities[3].command).toHaveBeenCalledWith({    it('should handle switch command errors', async () => {

        state: true,      const error = new Error('Switch command failed');

        brightness: 255,      mockNativeClient.switchCommandService.mockRejectedValue(error);

        red: 255,      

        green: 0,      await expect(client.setSwitchState(1, false)).rejects.toThrow('Switch command failed');

        blue: 0    });

      });  });

    });

  describe('State Subscription', () => {

    it('should throw error for unknown light entity', async () => {    beforeEach(async () => {

      await expect(client.setLightState(999, true)).rejects.toThrow('Light entity with key 999 not found');      await client.init();

    });    });

  });

});    it('should subscribe to state updates', async () => {
      mockNativeClient.subscribeStates.mockResolvedValue(undefined);
      
      await client.subscribeToStates();
      
      expect(mockNativeClient.subscribeStates).toHaveBeenCalled();
    });

    it('should handle subscription errors', async () => {
      const error = new Error('Subscription failed');
      mockNativeClient.subscribeStates.mockRejectedValue(error);
      
      await expect(client.subscribeToStates()).rejects.toThrow('Subscription failed');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await client.init();
    });

    it('should handle native client errors', () => {
      const mockErrorHandler = jest.fn();
      client.on('error', mockErrorHandler);
      
      // Simulate native client error
      const errorCallback = mockNativeClient.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorCallback) {
        const error = new Error('Native client error');
        errorCallback(error);
        expect(mockErrorHandler).toHaveBeenCalledWith(error);
      }
    });

    it('should handle native client disconnection', () => {
      const mockDisconnectHandler = jest.fn();
      client.on('disconnect', mockDisconnectHandler);
      
      // Simulate native client disconnect
      const disconnectCallback = mockNativeClient.on.mock.calls.find(call => call[0] === 'disconnected')?.[1];
      if (disconnectCallback) {
        disconnectCallback();
        expect(mockDisconnectHandler).toHaveBeenCalled();
      }
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on disconnect', async () => {
      await client.init();
      mockNativeClient.disconnect.mockResolvedValue(undefined);
      
      await client.disconnect();
      
      expect(mockNativeClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', async () => {
      // Should not throw error
      await client.disconnect();
    });
  });
});
