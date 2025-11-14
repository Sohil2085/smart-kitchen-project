# Spoilage Detection Feature Setup Guide

This guide explains how to set up and use the spoilage detection feature for fruits and vegetables in the inventory management system.

## Overview

The spoilage detection feature allows you to:
- Capture images of fruits and vegetables using your device camera
- Automatically detect if items have spoilage
- Get an estimate of how many days the item can still be used

## Components

1. **Python FastAPI Service** (`ai-model/spoilage_detection/app/main.py`)
   - Handles image analysis and spoilage detection
   - Runs on port 8003 by default

2. **Backend API Endpoint** (`backend/src/controllers/inventory.controller.js`)
   - Receives images from frontend
   - Forwards to Python service for analysis
   - Returns results to frontend

3. **Frontend Camera Component** (`frontend/src/components/CameraCapture.jsx`)
   - Provides camera interface for capturing images
   - Supports both camera capture and file upload

4. **Inventory Management Integration** (`frontend/src/pages/InventoryManagement.jsx`)
   - Displays spoilage detection section
   - Shows results with spoilage level and days remaining

## Setup Instructions

### Step 1: Install Python Dependencies

Navigate to the spoilage detection service directory:

```bash
cd ai-model/spoilage_detection/app
```

Install required packages:

```bash
pip install -r requirements.txt
```

Required packages:
- fastapi
- uvicorn
- python-multipart
- pillow
- opencv-python
- numpy
- python-dotenv

### Step 2: Start the Python Service

Run the spoilage detection service:

```bash
# From ai-model/spoilage_detection/app directory
python main.py
```

Or using uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

The service will start on `http://localhost:8003`

### Step 3: Configure Backend (Optional)

If the Python service is running on a different URL or port, set the environment variable in your backend:

```env
SPOILAGE_SERVICE_URL=http://localhost:8003
```

The backend defaults to `http://localhost:8003` if not specified.

### Step 4: Start the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

## Using the Feature

1. **Navigate to Inventory Management**
   - Go to the Inventory Management page in your application

2. **Access Spoilage Detection**
   - You'll see a "Spoilage Detection" section at the top of the page
   - Optionally select item type (Vegetables/Fruits) or leave as "Auto-detect"

3. **Capture Image**
   - Click "Detect Spoilage" button
   - Allow camera permissions when prompted
   - Position the fruit/vegetable in the camera view
   - Click "Capture Photo" or use "Upload from Device" to select an image file

4. **View Results**
   - The system will analyze the image
   - Results will show:
     - **Spoilage Level**: Fresh, Slightly Spoiled, Moderately Spoiled, Spoiled, or Highly Spoiled
     - **Spoilage Score**: 0-100 score indicating spoilage
     - **Days Remaining**: Estimated days until item should be used
     - **Item Type**: Detected type (vegetables/fruits)

## Understanding Results

### Spoilage Levels

- **Fresh** (Score: 0-20): Item is in good condition, can be used normally
- **Slightly Spoiled** (Score: 20-40): Minor spoilage detected, use soon
- **Moderately Spoiled** (Score: 40-60): Noticeable spoilage, use within 1-2 days
- **Spoiled** (Score: 60-80): Significant spoilage, use immediately or discard
- **Highly Spoiled** (Score: 80-100): Severe spoilage, should be discarded

### Days Remaining

The system estimates days remaining based on:
- Spoilage level detected
- Item type (vegetables vs fruits)
- Visual analysis of the image

**Note**: These are estimates. Always use your judgment and follow food safety guidelines.

## Troubleshooting

### Camera Not Working

- Ensure browser permissions for camera access are granted
- Try using "Upload from Device" as an alternative
- Check if your device has a working camera

### Service Not Available Error

- Ensure the Python service is running on port 8003
- Check if the service URL is correct in backend environment variables
- Verify the service is accessible: `http://localhost:8003/health`

### Poor Detection Results

- Ensure good lighting when capturing images
- Capture clear, focused images
- Position the item so it fills most of the frame
- Try different angles if detection seems inaccurate

## Technical Details

### Detection Algorithm

The service uses computer vision techniques:

1. **Color Analysis**:
   - Detects brown/dark spots (spoilage indicators)
   - Measures color saturation and brightness
   - Lower values indicate potential spoilage

2. **Texture Analysis**:
   - Calculates texture variance
   - Detects edge density
   - Irregular patterns indicate spoilage

3. **Scoring**:
   - Combines features into a 0-100 spoilage score
   - Maps to spoilage levels
   - Estimates days remaining

### API Endpoints

**Backend Endpoint:**
```
POST /api/v1/inventory/detect-spoilage
Content-Type: multipart/form-data
Body: { image: File, item_type?: string }
```

**Python Service Endpoint:**
```
POST http://localhost:8003/detect-spoilage
Content-Type: multipart/form-data
Body: { file: File, item_type?: string }
```

## Future Enhancements

Potential improvements:
- Machine learning model training for better accuracy
- Support for more food categories
- Batch processing of multiple images
- Historical tracking of spoilage patterns
- Integration with expiry date calculations

## Support

For issues or questions:
1. Check that all services are running
2. Verify environment variables are set correctly
3. Check browser console for frontend errors
4. Check backend logs for API errors
5. Check Python service logs for detection errors

