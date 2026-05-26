#!/usr/bin/env python3
import subprocess
from dasbus.connection import SessionMessageBus

INTERFACE_NAME = "com.giannis.HeadsetControl"
OBJECT_PATH = "/com/giannis/HeadsetControl"

# Connect to the user's session bus
bus = SessionMessageBus()

def broadcast_hangup():
    # Correct GLib/dasbus method to broadcast a signal:
    # emit_signal(destination, object_path, interface_name, signal_name, parameters)
    bus.connection.emit_signal(
        None,
        OBJECT_PATH,
        INTERFACE_NAME,
        "HangupPressed",
        None
    )
    print(">> D-Bus Signal Emitted: HangupPressed", flush=True)

def monitor_headset():
    proc = subprocess.Popen(
        ['stdbuf', '-oL', 'btmon'],
        stdout=subprocess.PIPE,
        text=True
    )
    print("Listening for raw HFP AT+CHUP wire sequences...", flush=True)
    try:
        for line in proc.stdout:
            if "AT+CHUP" in line:
                broadcast_hangup()
    except KeyboardInterrupt:
        proc.terminate()

if __name__ == "__main__":
    monitor_headset()