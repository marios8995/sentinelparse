import time
import json
import os
from probe_json import get_probe_data
from database import (
    save_snapshot,
    aggregate_hourly_data, aggregate_daily_data, aggregate_monthly_data, aggregate_yearly_data,
    cleanup_raw_data, cleanup_hourly_data, cleanup_daily_data, cleanup_monthly_data
)

STATE_FILE = "maintenance_state.json"

class MaintenanceManager:
    def __init__(self):
        self.state = self._load_state()

    def _load_state(self):
        now = time.time()
        default_state = {
            "last_hourly": now,
            "last_daily": now,
            "last_monthly": now,
            "last_yearly": now
        }

        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, "r") as f:
                    saved_state = json.load(f)
                    print(f"[{time.strftime('%H:%M:%S')}] Maintenance state loaded from {STATE_FILE}.")
                    return {**default_state, **saved_state}
            except Exception as e:
                print(f"Warning: Could not read {STATE_FILE} ({e}). Using default times.")

        self._save_state(default_state)
        return default_state

    def _save_state(self, state_to_save=None):
        if state_to_save is None:
            state_to_save = self.state
        try:
            with open(STATE_FILE, "w") as f:
                json.dump(state_to_save, f, indent=4)
        except Exception as e:
            print(f"Warning: Could not save maintenance state: {e}")

    def check_and_run(self):
        now = time.time()
        state_changed = False

        if now - self.state["last_hourly"] >= 3595:
            print(f"[{time.strftime('%H:%M:%S')}] Triggering Hourly Maintenance...")
            aggregate_hourly_data()
            cleanup_raw_data()
            self.state["last_hourly"] = now
            state_changed = True

        if now - self.state["last_daily"] >= 86395:
            print(f"[{time.strftime('%H:%M:%S')}] Triggering Daily Maintenance...")
            aggregate_daily_data()
            cleanup_hourly_data()
            self.state["last_daily"] = now
            state_changed = True

        if now - self.state["last_monthly"] >= 2591995:
            print(f"[{time.strftime('%H:%M:%S')}] Triggering Monthly Maintenance...")
            aggregate_monthly_data()
            cleanup_daily_data()
            self.state["last_monthly"] = now
            state_changed = True

        if now - self.state["last_yearly"] >= 31535995:
            print(f"[{time.strftime('%H:%M:%S')}] Triggering Yearly Maintenance...")
            aggregate_yearly_data()
            cleanup_monthly_data()
            self.state["last_yearly"] = now
            state_changed = True

        if state_changed:
            self._save_state()


def main():
    print("Sentinel Collector started. Press Ctrl+C to stop.")
    interval = 10
    manager = MaintenanceManager()

    try:
        while True:
            start_time = time.perf_counter()

            manager.check_and_run()

            data = get_probe_data()
            save_snapshot(data)

            elapsed_time = time.perf_counter() - start_time
            sleep_time = interval - elapsed_time

            if sleep_time > 0:
                time.sleep(sleep_time)
            else:
                print(f"Warning: Cycle took {elapsed_time:.2f}s (exceeded interval). Skipping sleep!")

    except KeyboardInterrupt:
        print("\nSentinel Collector stopped cleanly.")
    except Exception as e:
        print(f"An error occurred in the main loop: {e}")


if __name__ == "__main__":
    main()
