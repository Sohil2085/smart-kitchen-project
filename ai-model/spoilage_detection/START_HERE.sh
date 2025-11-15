#!/bin/bash
echo "========================================"
echo "Smart Kitchen - Spoilage Detection Setup"
echo "========================================"
echo ""
echo "This will set up everything automatically..."
echo ""

# Create necessary directories
mkdir -p app/models
mkdir -p train/data

echo "[1/3] Installing dependencies..."
cd app
pip install -r requirements.txt --quiet || pip3 install -r requirements.txt

cd ..

echo ""
echo "[2/3] Setup complete!"
echo ""
echo "[3/3] Starting service..."
echo ""
echo "========================================"
echo "Service is starting on http://localhost:8003"
echo "Press Ctrl+C to stop"
echo "========================================"
echo ""

cd app
python main.py || python3 main.py



