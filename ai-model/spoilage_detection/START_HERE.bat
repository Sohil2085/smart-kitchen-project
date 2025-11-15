@echo off
echo ========================================
echo Smart Kitchen - Spoilage Detection Setup
echo ========================================
echo.
echo This will set up everything automatically...
echo.

REM Create necessary directories
if not exist "app\models" mkdir app\models
if not exist "train\data" mkdir train\data

echo [1/3] Installing dependencies...
cd app
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo Error installing dependencies. Trying with pip3...
    pip3 install -r requirements.txt
)

cd ..

echo.
echo [2/3] Setup complete!
echo.
echo [3/3] Starting service...
echo.
echo ========================================
echo Service is starting on http://localhost:8003
echo Press Ctrl+C to stop
echo ========================================
echo.

cd app
python main.py



