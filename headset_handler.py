#!/usr/bin/env python3
import re
import subprocess
from dasbus.connection import SessionMessageBus

INTERFACE_NAME = "com.giannis.HeadsetControl"
OBJECT_PATH = "/com/giannis/HeadsetControl"

# Connect to the user's session bus
bus = SessionMessageBus()

def broadcast(signal_name):
    # Correct GLib/dasbus method to broadcast a signal:
    # emit_signal(destination, object_path, interface_name, signal_name, parameters)
    bus.connection.emit_signal(
        None,
        OBJECT_PATH,
        INTERFACE_NAME,
        signal_name,
        None
    )
    print(f">> D-Bus Signal Emitted: {signal_name}", flush=True)

def broadcast_hangup():
    broadcast("HangupPressed")

# AVRCP pass-through "FORWARD pressed" (AVCTP PID 0x110e, ctype CONTROL, panel subunit, PASS THROUGH, op 0x4b).
# Outside an HFP call the JBL sends a double-tap as "next track" instead of AT+CHUP. It is broadcast as a
# separate ForwardPressed signal so listeners can decide (e.g. mute only while in a call; music keeps working).
# Matches only the incoming command (responses carry ctype 0x09, releases op 0xcb).
AVRCP_FORWARD_PRESS = re.compile(r"\b11 0e 00 48 7c 4b\b")

def monitor_headset():
    proc = subprocess.Popen(
        ['stdbuf', '-oL', 'btmon'],
        stdout=subprocess.PIPE,
        text=True
    )
    print("Listening for HFP AT+CHUP and AVRCP FORWARD sequences...", flush=True)
    try:
        for line in proc.stdout:
            if "AT+CHUP" in line:
                broadcast_hangup()
            elif AVRCP_FORWARD_PRESS.search(line):
                broadcast("ForwardPressed")
    except KeyboardInterrupt:
        proc.terminate()

if __name__ == "__main__":
    monitor_headset()