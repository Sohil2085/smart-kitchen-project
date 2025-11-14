@echo off
echo ========================================
echo Training Spoilage Detection CNN Model
echo Using FruitVision Dataset
echo ========================================
echo.

cd /d "%~dp0"

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
echo Starting training...
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

