@echo off
REM Quick setup script for spoilage detection service (Windows)

echo Setting up Spoilage Detection Service...
echo ========================================

REM Create models directory
if not exist "app\models" mkdir app\models
if not exist "train\data" mkdir train\data

REM Install app dependencies
echo Installing app dependencies...
cd app
pip install -r requirements.txt

REM Install training dependencies
echo Installing training dependencies...
cd ..\train
pip install -r requirements.txt

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Set up Kaggle API (see train\README_TRAINING.md)
echo 2. Train models: cd train ^&^& python train_yolo.py
echo 3. Start service: cd app ^&^& python main.py

cd ..



