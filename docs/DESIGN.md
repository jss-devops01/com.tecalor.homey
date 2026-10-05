# Tecalor THZ 504 Homey app: design (rewrite)

Status: draft, Python chosen pending a dependency spike. Source of truth for entities:
`jss-devops01/ESP32-C6_THZ-504` @ `ff8e60e` (`yaml/wp_base.yaml`, `yaml/common.yaml`, `yaml/thz504.yaml`, `src/`).

## 1. Language decision

Correction: Homey now has an official **Python Apps SDK** ([announcement](https://homey.app/en-us/news/introducing-the-python-apps-sdk/), [App docs](https://apps.developer.homey.app/the-basics/app)). Facts checked on 2026-10-05:
- Runs on Homey Pro (2023 to 2026), Homey Pro mini, Homey Cloud and Homey Self-Hosted Server. Python 3.14 on device.
- Files are `app.py`, `driver.py`, `device.py`; manifest/compose layout is the same as for JS apps.
- Dependencies are added with `homey app dependencies add <pkg>`; the CLI pre-compiles them in Docker (`.python_cache/`) so they ship with the app. Docker Desktop is required locally (Colima reported broken).
- SDK package `homey` is at 0.0.11 (Aug 2026): young, expect rough edges and thin docs.

**Decision: Python**, using [`aioesphomeapi`](https://pypi.org/project/aioesphomeapi/) (the official ESPHome client used by Home Assistant: Noise encryption, reconnect logic, mDNS via zeroconf).

Main risk: `aioesphomeapi` pulls compiled dependencies (`cryptography`, `noiseprotocol`/`chacha20poly1305-reuseable`, `zeroconf`, `protobuf`). Step 1 is a spike that adds it via the Homey CLI, installs on the Homey and connects to the ESP. Fallback if it cannot be bundled: TypeScript with the same design.

## 2. Transport

- ESPHome native API, TCP 6053, Noise encryption (`api.encryption.key`). No MQTT in firmware.
- Discovery: mDNS `_esphomelib._tcp` (Homey `discovery` strategy, type `mdns-sd`). Fallback: manual host entry in pairing.
- Pairing asks for the API encryption key (stored in device store, never in code). Host/port are updated from mDNS on IP change.
- Entities are resolved **at runtime by `object_id`** from `ListEntities` (keys are hashes and change between builds). Unknown/missing entities are logged and skipped, never fatal.
- One connection per ESPHome node, shared by all Homey devices of that node (app-level connection manager). Reconnect with exponential backoff (1s → 60s cap), `alarm_connectivity`-style availability via `setUnavailable()`.
- Client library: `aioesphomeapi` (see section 1).

### Security findings (act regardless of option)
- The old app committed the API encryption key in `drivers/thz-504/driver.ts`. It is in git history: **rotate the key** in `secrets.yaml` and reflash.
- Firmware repo contains the fallback AP password (`esp32-c6-thz504.yaml`) and a static IP. Move to `!secret`.

## 3. Homey device model

Four Homey devices per ESPHome node (one driver each, shared connection). Rationale: each Homey tile then has one meaningful `target_temperature`, and flows read naturally ("Hot water target temperature").

### 3.1 Heat pump (class `heatpump`)
| Capability | Firmware entity (object_id) | R/W |
|---|---|---|
| `measure_temperature.outdoor` | `outside_temp` | R |
| `measure_temperature.flow` | `flow_temp_actual` | R |
| `measure_temperature.flow_setpoint` | `flow_temp_setpoint` | R |
| `measure_temperature.return` | `return_temp_actual` | R |
| `measure_temperature.collector` | `collector_temp_actual` | R |
| `measure_temperature.evaporator` | `evaporator_temp` | R |
| `operating_mode` (custom enum) | select `program_switch` (EMERGENCY/STANDBY/AUTO/DAY/HOLIDAY/DHW/MANUAL) | **W** |
| `alarm_compressor` / `compressor_running` (bool) | binary `compressor` | R |
| `measure_frequency.compressor` (custom, Hz) | `compressor_speed` | R |
| `measure_power` | `motor_power` (kW → W) | R |
| `measure_power.heat_output` | `heating_cooling_power` (kW → W) | R |
| `measure_percentage.heating_power` | `heating_power_relative` | R |
| `measure_current` / `measure_voltage` | `motor_current` / `motor_voltage` | R |
| `measure_pressure.low` (bar) | `low_pressure_display` | R |
| `meter_power` (kWh, energy dashboard) | sum of `electric_energy_dhw_total_kwh` + `electric_energy_heating_total_kwh` (daily, resets at midnight on device) — app accumulates a monotonic total in store | R |
| `meter_power.heating_day` / `.dhw_day` | the two above | R |
| `meter_heat.*` (custom) | `heat_output_*_day_total_kwh`, `heat_output_*_total_mwh`, `heat_recovery_*`, `heat_output_2we_*` | R |
| `measure_cop.heating` / `.dhw` (custom) | `cop_heating_day`, `cop_dhw_day` | R |
| `compressor_starts` (custom) | `compressor_starts` | R |
| `alarm_generic` + `error_code` (custom string) | `error_message` (numeric code → text via table from `src/mapper.cpp`) | R |
| `alarm_defrost` | `defrost_evaporator` | R |
| `alarm_utility_lockout` | `utility_lockout` (EVU block) | R |
| `alarm_service` | `service` | R |
| booleans (status only) | `summer_mode_active`, `stove_fireplace_active`, `heatup_program_active`, `switch_program_active` | R |
| `measure_power.backup_heater` | `electric_heating_power` + binary `electric_backup_heating` | R |

### 3.2 Hot water (class `boiler`)
| Capability | Entity | R/W |
|---|---|---|
| `measure_temperature` | `storage_temp_actual` | R |
| `target_temperature` (30–75, step 1) | climate `hot_water_day` → `STORAGE_TEMP_SETPOINT_DAY` | **W** |
| `target_temperature.night` | climate `hot_water_night` | **W** |
| `measure_temperature.setpoint_active` | `storage_temp_setpoint` (effective) | R |
| `dhw_heating` (bool) | binary `dhw_heating` | R |
| `onoff.eco` | switch `dhw_eco` | **W** |
| `dhw_hysteresis` (number 2–10) | number `hysteresis_dhw` | **W** |
| `backup_heater_level` (0–3) | number `backup_heater_level_dhw` | **W** (setting, not tile) |

### 3.3 Heating circuit HC1 (class `thermostat`)
| Capability | Entity | R/W |
|---|---|---|
| `measure_temperature` | `room_temp_actual` | R |
| `measure_humidity` | `room_humidity` | R |
| `target_temperature` (10–25, step 0.5) | `ROOM_TEMP_SETPOINT_DAY` (see §5) | **W** |
| `target_temperature.night` | `ROOM_TEMP_SETPOINT_NIGHT` | **W** |
| `target_temperature.cooling` | `COOLING_ROOM_SETPOINT_DAY` | **W** |
| `measure_temperature.adjusted_setpoint` | `adjusted_room_temp_setpoint` | R |
| `measure_temperature.dewpoint` | `dewpoint_hc1` | R |
| `heating_active` / `cooling_active` | binary `heating`, `cooling` | R |
| `pump_running` | binary `heating_circuit_pump` | R |
| `onoff.cooling` | switch `cooling_mode` | **W** |
| Device settings (read-only display) | `slope_hc1`, `base_point_hc1`, `setpoint_min_hc1`, `setpoint_max_hc1`, `flow_share_hc1` | R |
| Device settings (writable) | numbers `room_influence`, `pump_speed_heating`, `design_power_heating`, `design_power_cooling` | **W** |

### 3.4 Ventilation (class `fan`)
| Capability | Entity | R/W |
|---|---|---|
| `fan_level` (custom enum 0–3) | fan `vent_level_day` | **W** |
| `fan_level.night` / `.party` | fans `vent_level_night`, `vent_level_party` | **W** |
| `onoff` | `vent_level_day` on/off (off = level 0) | **W** |
| `ventilation_active` | binary `ventilation` | R |
| `measure_temperature.exhaust` | `exhaust_air_temp` | R |
| `measure_temperature.exhaust_dewpoint` | `exhaust_air_dewpoint` | R |
| `measure_humidity.exhaust` | `exhaust_air_humidity` | R |
| `measure_airflow.supply/exhaust/outdoor` (l/min) | `*_air_setpoint` | R |
| `measure_frequency.supply/exhaust/outdoor` (Hz) | `*_air_actual` | R |
| `measure_pressure.filter` (Pa) | `differential_pressure` | R |
| `measure_power` | `fan_power` (estimated) | R |
| `passive_cooling` (custom enum) | select `passive_cooling` | **W** |
| `alarm_filter` | `filter_change_both` OR `_exhaust` OR `_supply` | R |
| `filter_runtime` (%, days) | `filter_runtime`, `filter_runtime_days` | R |
| Device settings (writable) | numbers `vent_supply_level1..3`, `vent_exhaust_level1..3` (0–300 m³/h) | **W** |

Not exposed: diagnostic ESP entities (uptime, Wi-Fi, IP, version, status LED, `heatpump_datetime`) go to device settings as read-only labels; restart button only via a maintenance flow card.

## 4. Flow cards

**Triggers**: error raised (tokens: code, text) / cleared; operating mode changed (token: mode); compressor started/stopped; defrost started/ended; DHW heating started/stopped; backup heater switched on; filter change required; utility lockout started/ended; connection lost/restored.

**Conditions**: operating mode is …; compressor is running; DHW is heating; heating/cooling is active; filter change is required; summer mode is active; utility lockout is active; device is connected.

**Actions**: set operating mode; set DHW day/night setpoint; set DHW eco on/off; set DHW hysteresis; set backup heater level; set room setpoint day/night/cooling; set cooling mode on/off; set ventilation level day/night/party; set passive cooling mode; **send room temperature/humidity** (see §5); synchronise heat pump time; restart controller.

All writes: range-clamped, rejected if device offline (flow fails with a clear error), confirmed by reading the value back; if not confirmed within 30s the flow card throws.

## 5. Firmware behaviours the app must work around

1. **Room temperature/humidity come from Home Assistant** (`common.yaml`, `platform: homeassistant`). Without HA, `gROOM_TEMP_ACTUAL` stays 0 and nothing is sent. Workaround **without firmware change**: the app calls the existing API action `can_send_value(property=0x0011, target="HK1", raw_value=temp*10)` and `(0x0075, HK1, humidity*10)` every 60s, fed by a flow action card or a chosen Homey sensor. Cleaner long-term fix (firmware, needs your OK): an `api.actions.set_room_climate(temperature, humidity)` that writes the globals.
2. **Heating climate writes cooling setpoints too.** `CustomClimate::control()` (`src/custom_climate.h`) sends the new target to *all* listed properties: setting "Heating Day" to 21 °C also sets `COOLING_ROOM_SETPOINT_DAY` on HK1 and HK2 to 21 °C. The app should therefore write room setpoints through `can_send_value` to HK1 with the specific property ID (allow-listed IDs only), not through the climate entity.
3. **Climate mode is not controllable.** `control()` ignores `mode` although OFF/HEAT/COOL are advertised. The app derives mode from binary sensors and controls the pump only via `program_switch`.
4. **`wp_number.yaml`: `if(x != NAN)` is always true** (NaN never compares equal). Harmless today because Homey validates ranges, but worth fixing to `!std::isnan(x)`.
5. Numbers/selects are `optimistic: true`: ESPHome echoes the requested value before the pump confirms. The app waits for the CAN readback (Manager callback) before treating a write as applied.
6. Daily energy counters reset at midnight on the device; the app must convert to monotonic `meter_power` for Homey Energy.

## 6. App structure (Python)

```
app.py                      connection manager registry, flow card registration
lib/esphome_link.py         aioesphomeapi wrapper (connect, reconnect, entity map by object_id, commands)
lib/thz/entities.py         single typed table: object_id -> capability, scale, R/W, range
lib/thz/errors.py           error code -> text (from firmware mapper.cpp)
lib/thz/writes.py           allow-listed can_send_value writes with range checks
drivers/heatpump|hotwater|heating_circuit|ventilation/driver.py, device.py
tests/                      pytest: entity table, scaling, write guards, reconnect (fake APIClient)
```

Quality gates: `homey app validate --level publish`, ruff, mypy with `homey-stubs`, pytest in the GitHub workflow.

## 7. Open questions
- Which Homey model do you run (Pro 2023+, Pro mini, Self-Hosted)? The 2019 Homey Pro is not supported by the Python SDK.
- Room temperature source: a specific Homey sensor, an average of several, or flow-card only?
- OK to propose the small firmware fixes in §5 (separate PR on the firmware repo)?
