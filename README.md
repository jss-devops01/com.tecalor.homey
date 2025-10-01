# Tecalor THZ-504 ESPHome Homey App

This Homey application provides integration with Tecalor THZ-504 heat pumps that are equipped with an ESP32-C6 running ESPHome firmware. The app communicates directly with the ESPHome device using the native Protocol Buffers API for efficient and real-time control.

## Features

- **Real-time monitoring** of heat pump sensors (temperature, power, current)
- **Climate control** with temperature setting and mode changes
- **Status monitoring** with automatic reconnection
- **Device discovery** with automatic IP detection
- **Protocol Buffers communication** for efficient data transfer
- **Configurable polling intervals**
- **Support for multiple entities** (sensors, climate, switches, lights)

## Requirements

- Homey Pro (2019 or later)
- ESP32-C6 device with ESPHome firmware
- Network connectivity between Homey and ESP32 device
- ESPHome API enabled on the ESP32 device

## Installation

1. Install the app from the Homey App Store (when published)
2. Or sideload during development:
   ```bash
   homey app install
   ```

## Configuration

### ESP32 Device Setup

Your ESP32 device should be configured with ESPHome and include:

```yaml
# Enable Home Assistant API
api:
  encryption:
    key: !secret api_encryption_key

# Enable logging
logger:
  level: INFO

# WiFi Configuration with static IP
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  manual_ip:
    static_ip: 192.168.200.80  # Configure as needed
    gateway: 192.168.200.1
    subnet: 255.255.255.0
```

### Adding a Device

1. Open the Homey app
2. Go to **Devices** → **Add Device**
3. Select **Tecalor** → **THZ-504 ESPHome Heat Pump**
4. The app will automatically try to discover devices on common IP addresses
5. If automatic discovery fails, manually configure:
   - **IP Address**: The static IP of your ESP32 device
   - **Port**: ESPHome API port (default: 6053)
   - **Password**: ESPHome API password (if configured)

### Device Settings

After adding the device, you can configure:

- **IP Address**: ESP32 device IP address
- **Port**: ESPHome API port
- **Password**: ESPHome API password
- **Poll Interval**: How often to check device status (5-300 seconds)

## Supported Capabilities

The app automatically detects and supports the following capabilities based on available ESPHome entities:

### Climate Control
- `target_temperature` - Set desired temperature
- `thermostat_mode` - Heat pump operating mode (off, heat, cool, auto)
- `measure_temperature` - Current temperature reading

### Monitoring
- `measure_power` - Power consumption (W)
- `measure_current` - Current draw (A)
- `measure_humidity` - Humidity level (%)
- `measure_pressure` - System pressure

### Control
- `onoff` - Main power switch
- Status LED control (automatic)

### Alarms
- `alarm_generic` - General system alarms
- `alarm_heat` - Heating system issues
- `alarm_problem` - Problem indicators

## Troubleshooting

### Connection Issues

1. **Device Not Found**
   - Verify ESP32 is powered on and connected to WiFi
   - Check IP address configuration
   - Ensure ESPHome API is enabled
   - Verify network connectivity between Homey and ESP32

2. **Authentication Failed**
   - Check API password in device settings
   - Verify ESPHome encryption key configuration

3. **Device Unavailable**
   - Check WiFi connection on ESP32
   - Restart ESP32 device
   - Check network firewall settings

### Performance Issues

1. **Slow Response**
   - Reduce poll interval in device settings
   - Check network latency
   - Verify ESP32 performance

2. **Connection Drops**
   - Check WiFi signal strength on ESP32
   - Verify power supply stability
   - Review ESPHome logs for errors

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Lint code
npm run lint

# Install to Homey (development)
homey app install
```

### Project Structure

```
├── lib/
│   ├── esphome-api.proto      # Protocol Buffers definitions
│   └── esphome-client.ts      # ESPHome client library
├── drivers/
│   └── thz-504/
│       ├── device.ts          # Device implementation
│       ├── driver.ts          # Driver implementation
│       └── driver.compose.json # Device configuration
├── app.ts                     # Main app file
└── package.json               # Dependencies and scripts
```

### ESPHome Protocol

The app uses Protocol Buffers to communicate with ESPHome devices over TCP. Key message types:

- **Hello/Connect**: Authentication and handshake
- **Device Info**: Device metadata and capabilities
- **List Entities**: Discover available sensors and controls
- **State Updates**: Real-time entity state changes
- **Commands**: Control entity states

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and support:
- Check the troubleshooting section above
- Review ESPHome device logs
- Submit issues on the project repository
- Contact the developer: js.susset@gmail.com

## Acknowledgments

- ESPHome team for the excellent firmware platform
- Athom for the Homey platform
- Protocol Buffers team for efficient binary serialization
