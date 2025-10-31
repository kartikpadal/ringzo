#!/usr/bin/env bash
# render-build.sh — install yt-dlp binary manually

set -e

echo "🚀 Installing yt-dlp binary..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

echo "✅ yt-dlp installed at:"
which yt-dlp

echo "Installing Node dependencies..."
npm install --prefix backend

echo "Build step complete ✅"
