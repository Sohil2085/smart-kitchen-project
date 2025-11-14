# Training Spoilage Detection Model

This guide explains how to train a CNN model for spoilage detection using the FruitVision dataset.

## Overview

The spoilage detection model is a CNN that classifies fruits as **Fresh** or **Rotten**.

## Prerequisites

**Install Training Dependencies**:
```bash
cd ai-model/spoilage_detection/train
pip install -r requirements.txt
```

Required packages:
- torch, torchvision
- pillow, opencv-python
- numpy, pandas
- scikit-learn

## Training Spoilage Detection Model

### Using FruitVision Dataset

The training script automatically uses the FruitVision dataset located in the `FruitVision/` folder.

**Dataset Structure:**
```
FruitVision/
  freshapple/
    img1.jpg
    img2.jpg
  freshbanana/
    ...
  freshgrape/
    ...
  freshmango/
    ...
  freshorange/
    ...
  rottenapple/
    img1.jpg
    ...
  rottenbanana/
    ...
  rottengrape/
    ...
  rottenmango/
    ...
  rottenorange/
    ...
```

**Train the Model:**

Using the batch file (Windows):
```bash
cd ai-model\spoilage_detection\train
train_fruitvision.bat
```

Or using Python directly:
```bash
cd ai-model/spoilage_detection/train
python train_spoilage_model.py --epochs 20 --batch_size 32
```

**Custom Parameters:**
```bash
python train_spoilage_model.py --epochs 30 --batch_size 64 --lr 0.0005
```

### Model Output

The trained model will be saved to:
- `train/models/spoilage_model.pth` (state dict)
- `train/models/spoilage_model_full.pth` (full model)
- `app/models/spoilage_model.pth` (for app usage)

## Quick Start

**Windows:**
```bash
cd ai-model\spoilage_detection\train
train_fruitvision.bat
```

**Linux/Mac:**
```bash
cd ai-model/spoilage_detection/train
python train_spoilage_model.py --epochs 20 --batch_size 32
```

## Model Performance

After training, you'll see:
- Training accuracy
- Validation accuracy
- Test accuracy
- Classification report

## Using Trained Model

Once training is complete:
1. The model is automatically saved to `app/models/spoilage_model.pth`
2. Restart the service: `python main.py`
3. The trained model will be automatically loaded

The service will:
1. Use the trained spoilage model (if available)
2. Fallback to Hugging Face models
3. Fallback to color/texture analysis

## Tips

- **More epochs** = Better accuracy (but slower training)
- **Larger batch size** = Faster training (needs more memory)
- **Data augmentation** = Better generalization
- **GPU** = Much faster training (automatic if available)

## Troubleshooting

### Dataset Not Found
- Check dataset path
- Verify dataset structure matches expected format

### Out of Memory
- Reduce batch size (e.g., `--batch_size 16`)
- Reduce image size in transforms (currently 224x224)

### Low Accuracy
- Train for more epochs
- Use more data
- Check data quality and labels

