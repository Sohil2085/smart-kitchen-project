@echo off
echo ========================================
echo Training Spoilage Detection CNN Model
echo Using GPU (if available)
echo ========================================
echo.

cd /d "%~dp0"

echo Checking GPU availability...
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PyTorch not installed or not accessible!
    echo Please install dependencies first:
    echo   pip install -r requirements.txt
    echo   OR
    echo   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
    echo.
    pause
    exit /b 1
)

echo.
echo Checking for FruitVision dataset...
if not exist "..\FruitVision" (
    echo ERROR: FruitVision dataset not found!
    echo Please make sure the FruitVision folder exists in:
    echo %~dp0..\FruitVision
    pause
    exit /b 1
)

echo Dataset found!
echo.
echo Starting training on GPU...
echo.

python train_spoilage_model.py --epochs 20 --batch_size 32

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Training completed successfully!
    echo Model saved to:
    echo   - models\spoilage_model.pth
    echo   - ..\app\models\spoilage_model.pth
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Training failed with error code %ERRORLEVEL%
    echo ========================================
)

pause

