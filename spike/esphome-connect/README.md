# Spike: aioesphomeapi on Homey (Python)

Throwaway, read-only test. It answers one question before the real app is built:
can a Homey Python app bundle `aioesphomeapi` and read the THZ 504 ESPHome node?

It never sends commands to the heat pump.

## Run it

Needs Node.js, Docker Desktop (Colima is reported not to work), and your Homey on the same LAN.

```sh
npm install -g homey
homey login
cd spike/esphome-connect
cp env.json.example env.json      # fill in host and API encryption key
homey app dependencies add aioesphomeapi
homey app run
```

## What to look for in the output

| Line | Meaning |
|---|---|
| `CHECK 1 OK` | library bundled and imports on Homey |
| `CHECK 2 OK` | encrypted connection works |
| `CHECK 3 OK` (+ any `WARN`) | entity list, and which expected entities are missing |
| `CHECK 4` | live values received |

Paste the output back in the project thread. Stop with Ctrl+C; nothing is installed permanently.
