import Homey from 'homey';
import { ESPHomeClient } from '../../lib/esphome-client-native';

interface DiscoveredDevice {
  name: string;
  data: {
    id: string;
  };
  settings: {
    ip_address: string;
    port: number;
    encryption_key?: string;
  };
  capabilities?: string[];
}

module.exports = class THZ504Driver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('THZ-504 ESPHome Driver has been initialized');
  }

  /**
   * onPair is called when a user starts pairing a device
   */
  async onPair(session: any) {
    this.log('Starting pairing session');

    // Register list_devices handler
    session.setHandler('list_devices', async (): Promise<DiscoveredDevice[]> => {
      this.log('Discovering devices for pairing');
      
      try {
        // Always provide a basic device that users can configure in settings
        const basicDevice: DiscoveredDevice = {
          name: 'THZ-504 ESPHome Heat Pump',
          data: {
            id: 'thz504-esphome',
          },
          settings: {
            ip_address: '192.168.200.80',
            port: 6053,
            encryption_key: 'Quvqw/PaxsHQ90BGdFN1jgDJ8iGgX2QfGVdvZttBemA=',
          },
          capabilities: [
            'measure_temperature',
            'target_temperature',
            'thermostat_mode',
            'onoff'
          ],
        };

        this.log('Returning basic device for pairing');
        return [basicDevice];
        
      } catch (error) {
        this.log('Error in list_devices handler:', error);
        
        // Always return an array, never null
        return [{
          name: 'THZ-504 Heat Pump (Manual Setup)',
          data: {
            id: 'thz504-manual',
          },
          settings: {
            ip_address: '192.168.200.80',
            port: 6053,
          },
          capabilities: ['onoff'],
        }];
      }
    });

    // Register add_devices handler
    session.setHandler('add_devices', async (devices: DiscoveredDevice[]): Promise<any[]> => {
      this.log('Adding selected devices:', devices);
      
      return devices.map(device => ({
        name: device.name,
        data: device.data,
        settings: device.settings,
      }));
    });
  }

};
