# Spoilage Detection Service

Complete AI-powered detection service that identifies both **specific fruits/vegetables** and their **spoilage status** using YOLO and trained models.

## Features

- ✅ **YOLO Detection**: Uses YOLOv8 to detect which fruit/vegetable it is
- ✅ **Trained Spoilage Model**: CNN model trained on Kaggle datasets for spoilage detection
- ✅ **Spoilage Detection**: Determines freshness level (Fresh, Slightly Spoiled, Moderately Spoiled, Spoiled, Highly Spoiled)
- ✅ **Days Remaining**: Estimates how many days the item can be used
- ✅ **Automatic Fallback**: Works even if custom models aren't available

## Quick Start

### 1. Install Dependencies

```bash
cd ai-model/spoilage_detection/app
pip install -r requirements.txt
```

### 2. Train Models (Optional but Recommended)

#### Train YOLO Model for Item Detection:

```bash
cd ../train
pip install -r requirements.txt

# Download dataset from Kaggle
python download_kaggle_dataset.py muhammadkhalid/fruits-and-vegetables-detection

# Train YOLO model
python train_yolo.py --data_dir data --epochs 50

# Copy trained model
cp runs/detect/fruit_vegetable_detector/weights/best.pt ../app/models/fruit_vegetable_yolo.pt
```

#### Train Spoilage Detection Model:

```bash
# Download spoilage dataset
python download_kaggle_dataset.py gtsaidata/fruit-and-vegetable-disease-dataset

# Train spoilage model
python train_spoilage_model.py --data_dir data --epochs 20

# Model will be saved to models/spoilage_model.pth
```

### 3. Start the Service

```bash
cd ../app
python main.py
```

**Note**: If you haven't trained custom models, the service will use:
- Base YOLO model for item detection
- Hugging Face models as fallback
- Color/texture analysis as final fallback

## Model Priority

The service tries models in this order:

### Item Detection:
1. **Custom Trained YOLO Model** (if available)
2. Base YOLO Model
3. Hugging Face Model (jazzmacedo/fruits-and-vegetables-detector-36)
4. Color-based detection (fallback)

### Spoilage Detection:
1. **Trained CNN Model** (from Kaggle dataset)
2. Hugging Face Model (RicardoPoleo/custom_cnn_model)
3. Color/texture analysis (fallback)

## API Endpoints

### Health Check
```
GET /health
```

Returns model loading status.

### Detect Spoilage & Item
```
POST /detect-spoilage
Content-Type: multipart/form-data
Body:
  - file: Image file (JPEG, PNG)
  - item_type (optional): "vegetables" or "fruits"
```

**Response:**
```json
{
  "success": true,
  "item_name": "Apple",
  "item_type": "fruits",
  "detected_item_name": "Apple",
  "item_detection_confidence": 95.5,
  "all_item_predictions": [...],
  "spoilage_level": "fresh",
  "spoilage_score": 15,
  "days_remaining": 5,
  "has_spoilage": false,
  "confidence": 92.3,
  "model_used": "trained_cnn"
}
```

## Configuration

Create `.env` file (optional):
```env
PORT=8003
YOLO_MODEL_PATH=models/fruit_vegetable_yolo.pt
TRAINED_SPOILAGE_MODEL=models/spoilage_model.pth
ITEM_DETECTION_MODEL=jazzmacedo/fruits-and-vegetables-detector-36
SPOILAGE_MODEL=RicardoPoleo/custom_cnn_model
```

## Training Models

See `train/README_TRAINING.md` for detailed training instructions.

### Quick Training:

```bash
cd train

# Install training dependencies
pip install -r requirements.txt

# Download datasets
python download_kaggle_dataset.py muhammadkhalid/fruits-and-vegetables-detection
python download_kaggle_dataset.py gtsaidata/fruit-and-vegetable-disease-dataset

# Train both models
python train_yolo.py --data_dir data --epochs 50
python train_spoilage_model.py --data_dir data --epochs 20
```

## Recommended Kaggle Datasets

### For YOLO Training:
- `muhammadkhalid/fruits-and-vegetables-detection` - YOLO format, 14 classes
- `mohamedmaher/fruit-and-vegetable-detection` - Detection dataset

### For Spoilage Training:
- `gtsaidata/fruit-and-vegetable-disease-dataset` - Healthy vs Rotten
- Any dataset with fresh/rotten labels

## Troubleshooting

### Models Not Loading
- Check model paths in `.env` file
- Verify models exist in `models/` directory
- Service will use fallback methods automatically

### Training Issues
- Ensure Kaggle API is set up (see `train/README_TRAINING.md`)
- Check dataset format matches expected structure
- Use GPU for faster training (automatic if available)

### Service Not Starting
- Check Python version (3.8+)
- Install all dependencies: `pip install -r requirements.txt`
- Check port 8003 is available

## Testing

```bash
curl -X POST "http://localhost:8003/detect-spoilage" \
  -F "file=@test_image.jpg"
```

## Integration

The service is already integrated with the backend. The backend calls:
```
POST http://localhost:8003/detect-spoilage
```

Make sure the service is running before using the spoilage detection feature in the frontend.

## Performance

- **YOLO Detection**: ~100-300ms per image
- **Spoilage Detection**: ~50-200ms per image
- **Total Time**: ~150-500ms per request
- **GPU Acceleration**: 2-5x faster if available
