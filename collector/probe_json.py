import subprocess
import os
import json
from pathlib import Path

def get_probe_path():
    base_dir = Path(__file__).resolve().parent
    probe_dir = base_dir.parent / "probe" / "bin"
    binary_name = "SentinelProbe.exe" if os.name == "nt" else "./SentinelProbe"
    probe_path = probe_dir / binary_name
    return probe_path

def get_probe_data():
    bin_path = None
    try:
        bin_path = get_probe_path()
        result = subprocess.run([str(bin_path)], capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as err:
        print(f"Probe Failed! Error: {err}")
    except FileNotFoundError:
        print(f"Could not find probe at {bin_path}.")
    except json.JSONDecodeError:
        print(f"Output was not valid JSON.")
    except Exception as err:
        print(f"Unknown Error: {err}")
    return None
