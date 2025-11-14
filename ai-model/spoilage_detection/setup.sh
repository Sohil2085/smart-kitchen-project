#!/bin/bash
# Quick setup script for spoilage detection service

echo "Setting up Spoilage Detection Service..."
echo "========================================"

# Create models directory
mkdir -p app/models
mkdir -p train/data

# Install app dependencies
echo "Installing app dependencies..."
cd app
pip install -r requirements.txt

# Install training dependencies
echo "Installing training dependencies..."
cd ../train
pip install -r requirements.txt

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up Kaggle API (see train/README_TRAINING.md)"
echo "2. Train models: cd train && python train_yolo.py"
echo "3. Start service: cd app && python main.py"

