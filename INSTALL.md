# JBL TUNE130NC to Microsoft Teams Bridge Deployment Guide

This document describes how to deploy an event-driven, sandboxed architecture that links hardware telephony buttons (`AT+CHUP` / Hangup events) from a Bluetooth headset directly to the web client of Microsoft Teams under Ubuntu 25.10.

---

## Architecture Overview
[JBL Earbud Touch]
│  (Bluetooth HFP Link)
▼
[ /usr/bin/btmon ]
│  (Piped stdout via systemd daemon)
▼
[ hardware service ] ──( D-Bus Signal: HeadsetControl )──► [ native messaging bridge ]
│
(JSON over stdout pipe)
▼
[ MS Teams Web App ] ◄──( Click Event )── [ content.js ] ◄── [ background.js ]

---

## Prerequisites

Ensure your Ubuntu system contains the required development tools and structural directories:

```bash
# Install core Python D-Bus bindings and structural packages
sudo apt update
sudo apt install python3-gi python3-gi-cairo

# Create local runtime bins and chrome configuration hooks if missing
mkdir -p ~/bin
mkdir -p ~/.config/google-chrome/NativeMessagingHosts/