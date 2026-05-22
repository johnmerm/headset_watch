import subprocess
import os


# Paths to standard Ubuntu system sounds
SOUND_MUTE = "/usr/share/sounds/freedesktop/stereo/window-attention.oga"
SOUND_UNMUTE = "/usr/share/sounds/freedesktop/stereo/audio-volume-change.oga"

def toggle_mute():
    # 1. Toggle Mute
    subprocess.run(["wpctl", "set-mute", "@DEFAULT_AUDIO_SOURCE@", "toggle"])
    
    # 2. Check current state
    # wpctl get-volume returns something like "Volume: 0.45 [MUTED]" or "Volume: 0.45"
    result = subprocess.run(
        ["wpctl", "get-volume", "@DEFAULT_AUDIO_SOURCE@"],
        capture_output=True, text=True
    )
    
    is_muted = "[MUTED]" in result.stdout

    # 3. Play distinctive sound and notify
    if is_muted:
        subprocess.run(["pw-play", SOUND_MUTE])
        subprocess.run(["notify-send", "-t", "800", "Mic Status", "MUTED", "-i", "microphone-sensitivity-muted-symbolic"])
    else:
        subprocess.run(["pw-play", SOUND_UNMUTE])
        subprocess.run(["notify-send", "-t", "800", "Mic Status", "LIVE", "-i", "microphone-sensitivity-high-symbolic"])


def monitor_headset():
    # Use -u for unbuffered binary output
    proc = subprocess.Popen(
        ['stdbuf', '-oL', 'btmon'], 
        stdout=subprocess.PIPE, 
        text=True
    )

    for line in proc.stdout:
        if "AT+CHUP" in line:
            toggle_mute()

if __name__ == "__main__":
    monitor_headset()