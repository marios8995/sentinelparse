from probe_json import get_probe_data
from database import save_snapshot, cleanup_data
import time

def main():
    print("Sentinel collector started.")
    tick_counter = 0
    interval = 10
    try:
        while True:
            start_time = time.perf_counter()
            data = get_probe_data()
            save_snapshot(data)

            if tick_counter % 360 == 0:
                cleanup_data()

            tick_counter += 1
            elapsed_time = time.perf_counter() - start_time
            sleep_time = interval - elapsed_time
            if sleep_time > 0:
                time.sleep(sleep_time)
            else:
                print(f"Warning: Probe took {elapsed_time:.2f}s, skipping sleep to catch up!")

    except KeyboardInterrupt:
        print("Sentinel collector stopped.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
