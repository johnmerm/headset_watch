#!/usr/bin/python3
import sys
import json
import struct
import logging
import os
from dasbus.connection import SessionMessageBus
from gi.repository import GLib

# Define an absolute file destination in your home directory
LOG_FILE = '/home/giannis/Views/mine/headset_watch/dbus_bridge.log'

# Configure the standard logging framework
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logging.info("--- Native Messaging Bridge Initialized via Framework ---")
logging.debug(f"Python Binary Path: {sys.executable}")


def send_message(message):
    try:
        content = json.dumps(message).encode('utf-8')
        # Format required by Chrome's Native Messaging API
        sys.stdout.buffer.write(struct.pack('I', len(content)))
        sys.stdout.buffer.write(content)
        sys.stdout.buffer.flush()
        logging.info(f"Successfully piped payload to Chrome: {message}")
    except Exception as e:
        logging.error(f"Failed to transmit payload to stdout: {str(e)}", exc_info=True)


def on_hangup(*args):
    logging.info("D-Bus 'HangupPressed' intercept confirmed. Preparing Chrome message...")
    send_message({"event": "hangup", "status": "pressed"})


try:
    logging.debug("Establishing connection to the DBus SessionMessageBus...")
    bus = SessionMessageBus()

    logging.debug("Registering signal subscription pattern...")
    bus.connection.signal_subscribe(
        None,
        "com.giannis.HeadsetControl",
        "HangupPressed",
        "/com/giannis/HeadsetControl",
        None,
        0,
        lambda *args: on_hangup()
    )

    logging.info("D-Bus subscription stable. Entering GLib concurrent event loop.")
    loop = GLib.MainLoop()
    loop.run()

except Exception as e:
    # exc_info=True automatically formats and appends the complete stack traceback
    logging.critical("Fatal exception encountered during operational lifecycle", exc_info=True)
    sys.exit(1)