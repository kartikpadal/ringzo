#!/bin/bash
echo "🚀 Installing yt-dlp binary..."
mkdir -p ./bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./bin/yt-dlp
chmod a+rx ./bin/yt-dlp
export PATH=$PATH:$(pwd)/bin

echo "✅ yt-dlp installed successfully."
