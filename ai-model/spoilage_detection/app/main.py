"""
Complete Spoilage Detection Service
Detects both:
1. Specific fruit/vegetable using YOLO (e.g., Apple, Banana, Tomato)
2. Spoilage status using trained model (Fresh, Slightly Spoiled, etc.)

Uses:
- YOLO for item detection (fruits/vegetables)
- Trained CNN model for spoilage detection (from Kaggle dataset)
- Fallback to Hugging Face models if custom models not available
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
from dotenv import load_dotenv
from PIL import Image
import io
import numpy as np
import cv2

# Import YOLO detector
try:
    from yolo_detector import YOLODetector
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("Warning: YOLO detector not available")

# Import ML libraries
try:
    from transformers import AutoImageProcessor, AutoModelForImageClassification
    import torch
    import torch.nn as nn
    HF_AVAILABLE = True
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {DEVICE}")
except ImportError:
    HF_AVAILABLE = False
    DEVICE = None
    print("Warning: transformers not available - will use fallback methods")

load_dotenv()

app = FastAPI(title="Smart Kitchen Complete Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PORT = int(os.getenv("PORT", 8003))

# Models
yolo_detector = None
item_detection_model = None
item_detection_processor = None
spoilage_detection_model = None
spoilage_detection_processor = None
trained_spoilage_model = None

# -------------------------
# Model Loading Functions
# -------------------------

def load_yolo_detector():
    """Load YOLO detector for fruit/vegetable detection"""
    global yolo_detector
    
    if not YOLO_AVAILABLE:
        return None
    
    if yolo_detector is None:
        try:
            # Try to load custom trained YOLO model
            custom_model_path = os.getenv("YOLO_MODEL_PATH", "models/fruit_vegetable_yolo.pt")
            if os.path.exists(custom_model_path):
                yolo_detector = YOLODetector(custom_model_path)
                print(f"✅ Loaded custom YOLO model from {custom_model_path}")
            else:
                # Use base YOLO model (works immediately, downloads automatically)
                yolo_detector = YOLODetector()
                if yolo_detector.model:
                    print("✅ Loaded YOLO detector (ready to use)")
                else:
                    print("⚠️ YOLO will download on first use")
        except Exception as e:
            print(f"❌ Could not load YOLO detector: {e}")
            yolo_detector = None
    
    return yolo_detector

def load_trained_spoilage_model():
    """Load trained spoilage detection model from Kaggle dataset"""
    global trained_spoilage_model
    
    if not HF_AVAILABLE or DEVICE is None:
        return None
    
    if trained_spoilage_model is None:
        try:
            model_path = os.getenv("TRAINED_SPOILAGE_MODEL", "models/spoilage_model.pth")
            if os.path.exists(model_path):
                # Define model architecture (must match training)
                class SpoilageCNN(nn.Module):
                    def __init__(self, num_classes=2):
                        super(SpoilageCNN, self).__init__()
                        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
                        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
                        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
                        self.conv4 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
                        self.pool = nn.MaxPool2d(2, 2)
                        self.dropout = nn.Dropout(0.5)
                        self.fc1 = nn.Linear(256 * 14 * 14, 512)
                        self.fc2 = nn.Linear(512, num_classes)
                        self.relu = nn.ReLU()
                    
                    def forward(self, x):
                        x = self.pool(self.relu(self.conv1(x)))
                        x = self.pool(self.relu(self.conv2(x)))
                        x = self.pool(self.relu(self.conv3(x)))
                        x = self.pool(self.relu(self.conv4(x)))
                        x = x.view(-1, 256 * 14 * 14)
                        x = self.dropout(self.relu(self.fc1(x)))
                        x = self.fc2(x)
                        return x
                
                trained_spoilage_model = SpoilageCNN(num_classes=2).to(DEVICE)
                trained_spoilage_model.load_state_dict(torch.load(model_path, map_location=DEVICE))
                trained_spoilage_model.eval()
                print(f"✅ Loaded trained spoilage model from {model_path}")
            else:
                print("No trained spoilage model found, will use Hugging Face model")
        except Exception as e:
            print(f"❌ Could not load trained spoilage model: {e}")
            trained_spoilage_model = None
    
    return trained_spoilage_model

def load_item_detection_model():
    """Load model for specific fruit/vegetable detection (36 classes)"""
    global item_detection_model, item_detection_processor
    
    if not HF_AVAILABLE:
        return None
    
    if item_detection_model is None:
        try:
            model_name = os.getenv("ITEM_DETECTION_MODEL", "jazzmacedo/fruits-and-vegetables-detector-36")
            print(f"Loading item detection model: {model_name}")
            item_detection_processor = AutoImageProcessor.from_pretrained(model_name)
            item_detection_model = AutoModelForImageClassification.from_pretrained(model_name)
            item_detection_model = item_detection_model.to(DEVICE)
            item_detection_model.eval()
            print(f"✅ Item detection model loaded successfully ({len(item_detection_model.config.id2label)} classes)")
        except Exception as e:
            print(f"❌ Could not load item detection model: {e}")
            item_detection_model = None
            item_detection_processor = None
    
    return item_detection_model

def load_spoilage_detection_model():
    """Load model for spoilage detection (healthy vs rotten)"""
    global spoilage_detection_model, spoilage_detection_processor
    
    if not HF_AVAILABLE:
        return None
    
    if spoilage_detection_model is None:
        try:
            model_name = os.getenv("SPOILAGE_MODEL", "RicardoPoleo/custom_cnn_model")
            print(f"Loading spoilage detection model: {model_name}")
            spoilage_detection_processor = AutoImageProcessor.from_pretrained(model_name)
            spoilage_detection_model = AutoModelForImageClassification.from_pretrained(model_name)
            spoilage_detection_model = spoilage_detection_model.to(DEVICE)
            spoilage_detection_model.eval()
            print("✅ Spoilage detection model loaded successfully")
        except Exception as e:
            print(f"❌ Could not load spoilage model: {e}")
            print("Will use fallback spoilage detection")
            spoilage_detection_model = None
            spoilage_detection_processor = None
    
    return spoilage_detection_model

# -------------------------
# Detection Functions
# -------------------------

def detect_specific_item(image):
    """Detect specific fruit or vegetable - try YOLO first, then Hugging Face"""
    # Try YOLO first (preferred for object detection)
    yolo = load_yolo_detector()
    if yolo:
        result = yolo.detect_primary_item(image)
        if result:
            return result
    
    # Fallback to Hugging Face model
    model = load_item_detection_model()
    
    if model is None or item_detection_processor is None:
        return None
    
    try:
        inputs = item_detection_processor(images=image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.nn.functional.softmax(logits, dim=1)
            
            # Get top 3 predictions
            top3_probs, top3_indices = torch.topk(probabilities, min(3, len(model.config.id2label)))
            
            predictions = []
            for i in range(len(top3_indices[0])):
                idx = top3_indices[0][i].item()
                prob = top3_probs[0][i].item()
                label = model.config.id2label[idx]
                predictions.append({
                    'item_name': label,
                    'confidence': round(prob * 100, 2)
                })
            
            top_prediction = predictions[0]
            
            # Determine category
            item_name_lower = top_prediction['item_name'].lower()
            vegetables_keywords = [
                'tomato', 'pepper', 'cucumber', 'carrot', 'potato', 'onion', 
                'broccoli', 'lettuce', 'cabbage', 'spinach', 'celery', 'corn', 
                'peas', 'bean', 'cauliflower', 'eggplant', 'zucchini', 'pepper'
            ]
            
            category = "vegetables" if any(veg in item_name_lower for veg in vegetables_keywords) else "fruits"
            
            return {
                'item_name': top_prediction['item_name'],
                'confidence': top_prediction['confidence'],
                'category': category,
                'all_predictions': predictions
            }
    except Exception as e:
        print(f"Error in item detection: {e}")
        return None

def detect_spoilage_with_model(image):
    """Detect spoilage - try trained model first, then Hugging Face"""
    # Try trained model first (from Kaggle dataset)
    trained_model = load_trained_spoilage_model()
    if trained_model:
        try:
            from torchvision import transforms
            
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            
            image_tensor = transform(image).unsqueeze(0).to(DEVICE)
            
            with torch.no_grad():
                outputs = trained_model(image_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                predicted_class = torch.argmax(probabilities, dim=1).item()
                confidence = probabilities[0][predicted_class].item()
            
            # Map to spoilage levels
            is_rotten = predicted_class == 1
            
            if is_rotten:
                if confidence > 0.85:
                    level = "highly_spoiled"
                    days = 0
                    score = 90
                elif confidence > 0.70:
                    level = "spoiled"
                    days = 1
                    score = 75
                elif confidence > 0.55:
                    level = "moderately_spoiled"
                    days = 2
                    score = 60
                else:
                    level = "slightly_spoiled"
                    days = 3
                    score = 40
            else:
                if confidence > 0.85:
                    level = "fresh"
                    days = 5
                    score = 10
                elif confidence > 0.70:
                    level = "fresh"
                    days = 4
                    score = 15
                else:
                    level = "slightly_spoiled"
                    days = 3
                    score = 25
            
            return {
                'spoilage_level': level,
                'spoilage_score': score,
                'days_remaining': days,
                'has_spoilage': is_rotten,
                'confidence': round(confidence * 100, 2),
                'model_used': 'trained_cnn'
            }
        except Exception as e:
            print(f"Error using trained model: {e}")
    
    # Fallback to Hugging Face model
    model = load_spoilage_detection_model()
    
    if model is None or spoilage_detection_processor is None:
        return None
    
    try:
        inputs = spoilage_detection_processor(images=image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.nn.functional.softmax(logits, dim=1)
            
            predicted_class = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][predicted_class].item()
            
            # Get class label
            class_label = model.config.id2label[predicted_class].lower()
            
            # Determine if rotten/spoiled
            is_rotten = any(keyword in class_label for keyword in ['rotten', 'diseased', 'spoiled', 'bad', 'unhealthy'])
            
            # Map to spoilage levels based on confidence
            if is_rotten:
                if confidence > 0.85:
                    level = "highly_spoiled"
                    days = 0
                    score = 90
                elif confidence > 0.70:
                    level = "spoiled"
                    days = 1
                    score = 75
                elif confidence > 0.55:
                    level = "moderately_spoiled"
                    days = 2
                    score = 60
                else:
                    level = "slightly_spoiled"
                    days = 3
                    score = 40
            else:
                if confidence > 0.85:
                    level = "fresh"
                    days = 5
                    score = 10
                elif confidence > 0.70:
                    level = "fresh"
                    days = 4
                    score = 15
                else:
                    level = "slightly_spoiled"
                    days = 3
                    score = 25
            
            return {
                'spoilage_level': level,
                'spoilage_score': score,
                'days_remaining': days,
                'has_spoilage': is_rotten or score >= 20,
                'confidence': round(confidence * 100, 2),
                'class_label': model.config.id2label[predicted_class],
                'model_used': 'neural_network'
            }
    except Exception as e:
        print(f"Error in spoilage detection: {e}")
        return None

def detect_spoilage_fallback(image_array):
    """Fallback spoilage detection using color and texture analysis"""
    hsv = cv2.cvtColor(image_array, cv2.COLOR_RGB2HSV)
    
    # Color analysis
    avg_saturation = np.mean(hsv[:, :, 1])
    avg_brightness = np.mean(hsv[:, :, 2])
    
    # Detect brown spots (spoilage)
    brown_mask = cv2.inRange(hsv, (10, 50, 0), (20, 255, 100))
    brown_percentage = np.sum(brown_mask > 0) / (image_array.shape[0] * image_array.shape[1]) * 100
    
    # Detect dark spots
    dark_mask = cv2.inRange(hsv, (0, 0, 0), (180, 255, 50))
    dark_percentage = np.sum(dark_mask > 0) / (image_array.shape[0] * image_array.shape[1]) * 100
    
    # Texture analysis
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    texture_variance = float(np.var(gray))
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / (gray.shape[0] * gray.shape[1]) * 100
    
    # Calculate spoilage score
    spoilage_score = 0.0
    
    if brown_percentage > 5:
        spoilage_score += 30
    elif brown_percentage > 2:
        spoilage_score += 15
    
    if dark_percentage > 10:
        spoilage_score += 25
    elif dark_percentage > 5:
        spoilage_score += 12
    
    if avg_saturation < 50:
        spoilage_score += 15
    
    if avg_brightness < 80:
        spoilage_score += 10
    
    if edge_density > 15:
        spoilage_score += 10
    
    if texture_variance > 2000:
        spoilage_score += 10
    
    spoilage_score = min(100, spoilage_score)
    
    # Determine level
    if spoilage_score < 20:
        level = "fresh"
        days = 5
    elif spoilage_score < 40:
        level = "slightly_spoiled"
        days = 3
    elif spoilage_score < 60:
        level = "moderately_spoiled"
        days = 2
    elif spoilage_score < 80:
        level = "spoiled"
        days = 1
    else:
        level = "highly_spoiled"
        days = 0
    
    return {
        'spoilage_level': level,
        'spoilage_score': round(spoilage_score, 2),
        'days_remaining': days,
        'has_spoilage': spoilage_score >= 20,
        'model_used': 'color_texture_analysis'
    }

def detect_item_fallback(image_array):
    """Fallback item detection using color analysis"""
    hsv = cv2.cvtColor(image_array, cv2.COLOR_RGB2HSV)
    height, width = image_array.shape[0], image_array.shape[1]
    total_pixels = height * width
    
    center_y_start = int(height * 0.2)
    center_y_end = int(height * 0.8)
    center_x_start = int(width * 0.2)
    center_x_end = int(width * 0.8)
    center_region = hsv[center_y_start:center_y_end, center_x_start:center_x_end]
    center_pixels = center_region.shape[0] * center_region.shape[1]
    
    green_mask = cv2.inRange(hsv, (35, 30, 30), (85, 255, 255))
    green_percentage = np.sum(green_mask > 0) / total_pixels * 100
    
    red_mask1 = cv2.inRange(hsv, (0, 30, 30), (10, 255, 255))
    red_mask2 = cv2.inRange(hsv, (170, 30, 30), (180, 255, 255))
    orange_mask = cv2.inRange(hsv, (5, 30, 30), (25, 255, 255))
    yellow_mask = cv2.inRange(hsv, (20, 30, 30), (35, 255, 255))
    purple_mask = cv2.inRange(hsv, (120, 30, 30), (150, 255, 255))
    
    fruit_percentage = (
        np.sum(red_mask1 > 0) + np.sum(red_mask2 > 0) + 
        np.sum(orange_mask > 0) + np.sum(yellow_mask > 0) + 
        np.sum(purple_mask > 0)
    ) / total_pixels * 100
    
    center_green = cv2.inRange(center_region, (35, 30, 30), (85, 255, 255))
    center_green_pct = np.sum(center_green > 0) / center_pixels * 100
    
    center_red1 = cv2.inRange(center_region, (0, 30, 30), (10, 255, 255))
    center_red2 = cv2.inRange(center_region, (170, 30, 30), (180, 255, 255))
    center_orange = cv2.inRange(center_region, (5, 30, 30), (25, 255, 255))
    center_yellow = cv2.inRange(center_region, (20, 30, 30), (35, 255, 255))
    center_purple = cv2.inRange(center_region, (120, 30, 30), (150, 255, 255))
    
    center_fruit_pct = (
        np.sum(center_red1 > 0) + np.sum(center_red2 > 0) +
        np.sum(center_orange > 0) + np.sum(center_yellow > 0) +
        np.sum(center_purple > 0)
    ) / center_pixels * 100
    
    weighted_green = (center_green_pct * 0.7) + (green_percentage * 0.3)
    weighted_fruit = (center_fruit_pct * 0.7) + (fruit_percentage * 0.3)
    
    if weighted_green > 5:
        category = "vegetables"
    elif weighted_fruit > 4:
        category = "fruits"
    elif weighted_green > weighted_fruit:
        category = "vegetables"
    else:
        avg_saturation = np.mean(center_region[:, :, 1])
        category = "fruits" if avg_saturation > 40 else "unknown"
    
    return {
        'item_name': 'Unknown',
        'category': category,
        'confidence': None,
        'all_predictions': []
    }

# -------------------------
# API Endpoints
# -------------------------

@app.get("/health")
def health_check():
    return {
        "status": "Complete Detection API is running",
        "yolo_detector_loaded": yolo_detector is not None,
        "trained_spoilage_model_loaded": trained_spoilage_model is not None,
        "item_model_loaded": item_detection_model is not None,
        "spoilage_model_loaded": spoilage_detection_model is not None,
        "device": str(DEVICE) if DEVICE else "cpu",
        "yolo_available": YOLO_AVAILABLE,
        "models_available": HF_AVAILABLE
    }

@app.post("/detect-spoilage")
async def detect_spoilage_endpoint(
    file: UploadFile = File(...),
    item_type: Optional[str] = None
):
    """
    Complete detection endpoint:
    - Detects specific fruit/vegetable (e.g., Apple, Banana, Tomato)
    - Detects spoilage status (Fresh, Slightly Spoiled, etc.)
    """
    try:
        # Read and preprocess image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image_array = np.array(image)
        
        # Resize if too large
        max_size = 800
        if image_array.shape[0] > max_size or image_array.shape[1] > max_size:
            scale = max_size / max(image_array.shape[0], image_array.shape[1])
            new_size = (int(image_array.shape[1] * scale), int(image_array.shape[0] * scale))
            image_array = cv2.resize(image_array, new_size)
            image = Image.fromarray(image_array)
        
        # 1. Detect specific item (fruit/vegetable)
        item_result = None
        if not item_type:
            # Try model-based detection
            item_result = detect_specific_item(image)
            if not item_result:
                # Fallback to basic category detection
                item_result = detect_item_fallback(image_array)
        else:
            item_result = {
                'item_name': item_type,
                'category': item_type,
                'confidence': None
            }
        
        # 2. Detect spoilage
        spoilage_result = detect_spoilage_with_model(image)
        if not spoilage_result:
            # Fallback to color/texture analysis
            spoilage_result = detect_spoilage_fallback(image_array)
        
        # Combine results
        return {
            "success": True,
            "item_name": item_result.get('item_name', 'Unknown'),
            "item_type": item_result.get('category', 'unknown'),
            "detected_item_type": item_result.get('category', 'unknown'),
            "detected_item_name": item_result.get('item_name', 'Unknown'),
            "item_detection_confidence": item_result.get('confidence'),
            "all_item_predictions": item_result.get('all_predictions', []),
            **spoilage_result
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error: {e}")
        print(f"Traceback: {error_details}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing image: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 Smart Kitchen - Spoilage Detection Service")
    print("=" * 60)
    print("Loading models (this may take a moment on first run)...")
    print("")
    
    # Load models (with helpful messages)
    print("📦 Loading YOLO detector...")
    load_yolo_detector()
    
    print("📦 Loading spoilage models...")
    load_trained_spoilage_model()
    load_item_detection_model()
    load_spoilage_detection_model()
    
    print("")
    print("=" * 60)
    print("✅ Service is ready!")
    print(f"🌐 Running on: http://localhost:{PORT}")
    print(f"💻 Device: {DEVICE if DEVICE else 'CPU'}")
    print("=" * 60)
    print("")
    print("💡 Tip: Use the camera feature in Inventory Management page")
    print("Press Ctrl+C to stop the service")
    print("")
    
    uvicorn.run(app, host="0.0.0.0", port=PORT)
