from probe_json import get_probe_data
from database import save_snapshot, cleanup_data
import time

def main():
    print("Sentinel collector started.")
    tick_counter = 0
    try:
        while True:
            data = get_probe_data()
            save_snapshot(data)

            if tick_counter % 360 == 0:
                cleanup_data()

            tick_counter += 1
            time.sleep(10)
    except KeyboardInterrupt:
        print("Sentinel collector stopped.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
