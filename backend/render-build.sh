#!/usr/bin/env bash
# Install yt-dlp globally
apt-get update && apt-get install -y python3-pip
pip install -U yt-dlp

# Start the backend
node index.js
