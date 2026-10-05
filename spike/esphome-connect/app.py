"""Throwaway spike: prove aioesphomeapi runs on Homey and reads the THZ 504 node.

Read-only. It connects, lists entities, listens to state updates for a while,
logs a summary and disconnects. It never sends commands to the heat pump.
"""

import asyncio
from collections import Counter

from homey.app import App

LISTEN_SECONDS = 120

# Entities the real app's design relies on (object_ids, see docs/DESIGN.md).
EXPECTED_OBJECT_IDS = {
    "outside_temp", "flow_temp_actual", "flow_temp_setpoint", "return_temp_actual",
    "storage_temp_actual", "storage_temp_setpoint", "room_temp_actual", "room_humidity",
    "program_switch", "passive_cooling", "compressor", "dhw_heating", "heating", "cooling",
    "defrost_evaporator", "error_message", "dhw_eco", "cooling_mode",
    "vent_level_day", "vent_level_night", "vent_level_party",
    "heating_day", "heating_night", "hot_water_day", "hot_water_night",
    "hysteresis_dhw", "backup_heater_level_dhw", "room_influence",
    "electric_energy_dhw_total_kwh", "electric_energy_heating_total_kwh",
    "cop_heating_day", "cop_dhw_day", "filter_change_both",
}
EXPECTED_SERVICES = {"can_send_value", "can_send_raw_data"}


class SpikeApp(App):
    async def on_init(self) -> None:
        try:
            import aioesphomeapi  # noqa: F401  (import itself is check 1)
        except Exception as err:  # pragma: no cover - spike diagnostics
            self.error(f"CHECK 1 FAILED: cannot import aioesphomeapi: {err!r}")
            return
        self.log("CHECK 1 OK: aioesphomeapi imported")
        self._task = asyncio.create_task(self._run())

    async def on_uninit(self) -> None:
        task = getattr(self, "_task", None)
        if task:
            task.cancel()

    async def _run(self) -> None:
        from aioesphomeapi import APIClient
        from aioesphomeapi.object_id import compute_object_id

        env = self.homey.env
        host = env.get("ESPHOME_HOST")
        psk = env.get("ESPHOME_NOISE_PSK")
        if not host or not psk:
            self.error("Missing ESPHOME_HOST or ESPHOME_NOISE_PSK in env.json")
            return

        client = APIClient(host, int(env.get("ESPHOME_PORT", "6053")), None, noise_psk=psk,
                           client_info="tecalor-homey-spike")
        try:
            await asyncio.wait_for(client.connect(login=True), timeout=30)
        except Exception as err:
            self.error(f"CHECK 2 FAILED: connect/handshake to {host}: {err!r}")
            return

        try:
            info = await client.device_info()
            self.log(f"CHECK 2 OK: connected to {info.name} (ESPHome {info.esphome_version}, MAC {info.mac_address})")

            entities, services = await client.list_entities_services()
            by_key = {}
            for ent in entities:
                object_id = ent.object_id or compute_object_id(ent.name)
                by_key[ent.key] = (object_id, type(ent).__name__)
            kinds = Counter(kind for _, kind in by_key.values())
            object_ids = {oid for oid, _ in by_key.values()}
            self.log(f"CHECK 3 OK: {len(entities)} entities: {dict(kinds)}")
            missing = sorted(EXPECTED_OBJECT_IDS - object_ids)
            if missing:
                self.error(f"CHECK 3 WARN: expected entities not found: {missing}")
            self.log(f"All object_ids: {sorted(object_ids)}")

            svc_names = {s.name for s in services}
            missing_svc = EXPECTED_SERVICES - svc_names
            self.log(f"Services: {sorted(svc_names)}"
                     + (f" MISSING: {sorted(missing_svc)}" if missing_svc else ""))

            seen: dict[str, object] = {}

            def on_state(state) -> None:
                object_id, _ = by_key.get(state.key, (f"key:{state.key}", ""))
                value = getattr(state, "state", None)
                if value is None:
                    value = getattr(state, "current_temperature", None)
                seen[object_id] = value

            client.subscribe_states(on_state)
            self.log(f"Listening to state updates for {LISTEN_SECONDS}s ...")
            await asyncio.sleep(LISTEN_SECONDS)

            self.log(f"CHECK 4: received states for {len(seen)}/{len(entities)} entities")
            for object_id in sorted(EXPECTED_OBJECT_IDS & seen.keys()):
                self.log(f"  {object_id} = {seen[object_id]!r}")
            silent = sorted(EXPECTED_OBJECT_IDS & object_ids - seen.keys())
            if silent:
                self.log(f"  no update yet (slow poll intervals are normal): {silent}")
        except Exception as err:
            self.error(f"Spike failed after connect: {err!r}")
        finally:
            await client.disconnect()
            self.log("Spike finished, disconnected.")


homey_export = SpikeApp
