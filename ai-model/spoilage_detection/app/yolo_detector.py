"""
YOLO-based fruit and vegetable detection
Uses YOLOv8 for detecting and classifying fruits/vegetables
"""
import os
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Optional

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("ultralytics not available - install with: pip install ultralytics")

class YOLODetector:
    """YOLO detector for fruits and vegetables"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_path = model_path
        
        if not YOLO_AVAILABLE:
            return
        
        try:
            if model_path and os.path.exists(model_path):
                # Load custom trained model
                self.model = YOLO(model_path)
                print(f"Loaded custom YOLO model from {model_path}")
            else:
                # Use pre-trained YOLOv8 model (works immediately, no training needed)
                try:
                    self.model = YOLO('yolov8n.pt')  # Nano model for speed
                    print("✅ Loaded YOLOv8 pre-trained model (works immediately)")
                except Exception as e:
                    print(f"Note: YOLO will download on first use: {e}")
                    self.model = None
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            self.model = None
    
    def detect_items(self, image: Image) -> List[Dict]:
        """
        Detect fruits and vegetables in image using YOLO
        
        Returns:
            List of detected items with bounding boxes and confidence
        """
        if not self.model or not YOLO_AVAILABLE:
            return []
        
        try:
            # Convert PIL to numpy array
            image_array = np.array(image)
            
            # Run YOLO detection
            results = self.model(image_array)
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Get class and confidence
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    class_name = result.names[cls]
                    
                    # Get bounding box
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    # Accept all detections with good confidence
                    # YOLO base model can detect objects, we'll use it for general detection
                    # For better results, train custom model, but this works immediately
                    if conf > 0.3:  # Lower threshold to catch more items
                        detections.append({
                            'item_name': class_name,
                            'confidence': round(conf * 100, 2),
                            'bbox': [float(x1), float(y1), float(x2), float(y2)]
                        })
            
            return detections
            
        except Exception as e:
            print(f"Error in YOLO detection: {e}")
            return []
    
    def detect_primary_item(self, image: Image) -> Optional[Dict]:
        """Detect the primary (most confident) fruit/vegetable"""
        detections = self.detect_items(image)
        
        if not detections:
            return None
        
        # Return the most confident detection
        primary = max(detections, key=lambda x: x['confidence'])
        
        # Determine category
        item_name_lower = primary['item_name'].lower()
        vegetables_keywords = [
            'tomato', 'pepper', 'cucumber', 'carrot', 'potato', 'onion',
            'broccoli', 'lettuce', 'cabbage', 'spinach', 'celery', 'corn',
            'peas', 'bean', 'cauliflower', 'eggplant', 'zucchini'
        ]
        
        category = "vegetables" if any(veg in item_name_lower for veg in vegetables_keywords) else "fruits"
        
        return {
            'item_name': primary['item_name'],
            'confidence': primary['confidence'],
            'category': category,
            'bbox': primary['bbox']
        }

def train_yolo_model(data_dir: str, epochs: int = 50):
    """
    Train YOLO model on custom dataset
    
    Dataset structure should be:
    data/
      train/
        images/
        labels/
      val/
        images/
        labels/
    """
    if not YOLO_AVAILABLE:
        print("Please install ultralytics: pip install ultralytics")
        return
    
    try:
        from ultralytics import YOLO
        
        # Load pre-trained YOLOv8 model
        model = YOLO('yolov8n.pt')
        
        # Train on custom dataset
        results = model.train(
            data=f'{data_dir}/dataset.yaml',  # YOLO dataset config
            epochs=epochs,
            imgsz=640,
            batch=16,
            name='fruit_vegetable_detector'
        )
        
        print(f"Model trained! Saved to: {results.save_dir}")
        return results.save_dir
        
    except Exception as e:
        print(f"Error training YOLO model: {e}")
        return None

