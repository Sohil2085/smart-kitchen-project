"""
Train spoilage detection model using FruitVision dataset
Trains a CNN model for spoilage detection on the FruitVision dataset
"""
import os
import sys
import pandas as pd
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import cv2
import glob

class SpoilageDataset(Dataset):
    """Dataset class for spoilage detection"""
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        image_path = self.image_paths[idx]
        image = Image.open(image_path).convert('RGB')
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
        
        return image, label

class SpoilageCNN(nn.Module):
    """CNN model for spoilage detection"""
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

def prepare_dataset(data_dir):
    """Prepare dataset from FruitVision directory structure"""
    image_paths = []
    labels = []
    
    # FruitVision structure: data_dir/freshapple/, data_dir/rottenapple/, etc.
    # Get all subdirectories
    if not os.path.exists(data_dir):
        print(f"Error: Dataset directory '{data_dir}' does not exist!")
        return [], []
    
    subdirs = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    
    print(f"Found {len(subdirs)} subdirectories in {data_dir}")
    
    for subdir in subdirs:
        subdir_path = os.path.join(data_dir, subdir)
        subdir_lower = subdir.lower()
        
        # Determine label from directory name
        if 'rotten' in subdir_lower or 'spoiled' in subdir_lower or 'bad' in subdir_lower:
            label = 1  # Rotten/Spoiled
        elif 'fresh' in subdir_lower or 'healthy' in subdir_lower:
            label = 0  # Fresh/Healthy
        else:
            print(f"Warning: Could not determine label for '{subdir}', skipping...")
            continue
        
        # Get all image files in this subdirectory
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
        for ext in image_extensions:
            image_files = glob.glob(os.path.join(subdir_path, ext))
            for image_path in image_files:
                image_paths.append(image_path)
                labels.append(label)
        
        print(f"  {subdir}: {len([l for l in labels if l == label])} images (label: {'Rotten' if label == 1 else 'Fresh'})")
    
    return image_paths, labels

def train_model(data_dir, epochs=10, batch_size=32, learning_rate=0.001):
    """Train spoilage detection model"""
    print("Preparing dataset...")
    image_paths, labels = prepare_dataset(data_dir)
    
    if len(image_paths) == 0:
        print("No images found. Please check dataset directory structure.")
        return None
    
    print(f"Found {len(image_paths)} images")
    print(f"Fresh: {labels.count(0)}, Rotten: {labels.count(1)}")
    
    # Split dataset: 70% train, 15% validation, 15% test
    X_temp, X_test, y_temp, y_test = train_test_split(
        image_paths, labels, test_size=0.15, random_state=42, stratify=labels
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.176, random_state=42, stratify=y_temp  # 0.176 = 15/85
    )
    
    print(f"\nDataset splits:")
    print(f"  Train: {len(X_train)} images")
    print(f"  Validation: {len(X_val)} images")
    print(f"  Test: {len(X_test)} images")
    
    # Data transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Create datasets
    train_dataset = SpoilageDataset(X_train, y_train, transform=train_transform)
    val_dataset = SpoilageDataset(X_val, y_val, transform=test_transform)
    test_dataset = SpoilageDataset(X_test, y_test, transform=test_transform)
    
    # Use num_workers=0 on Windows to avoid multiprocessing issues
    num_workers = 0 if sys.platform == 'win32' else 2
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    
    # Initialize model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = SpoilageCNN(num_classes=2).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)
    
    print(f"Training on device: {device}")
    print(f"Starting training for {epochs} epochs...")
    print()
    
    best_val_acc = 0.0
    best_model_state = None
    
    # Training loop
    for epoch in range(epochs):
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()
        
        train_loss = train_loss / len(train_loader)
        train_acc = 100 * train_correct / train_total
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_loss = val_loss / len(val_loader)
        val_acc = 100 * val_correct / val_total
        
        # Learning rate scheduling
        scheduler.step(val_loss)
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = model.state_dict().copy()
        
        print(f"Epoch [{epoch+1}/{epochs}]")
        print(f"  Train - Loss: {train_loss:.4f}, Acc: {train_acc:.2f}%")
        print(f"  Val   - Loss: {val_loss:.4f}, Acc: {val_acc:.2f}% (Best: {best_val_acc:.2f}%)")
        print()
    
    # Load best model
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
        print(f"Loaded best model with validation accuracy: {best_val_acc:.2f}%")
        print()
    
    # Evaluate
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    accuracy = accuracy_score(all_labels, all_preds)
    print(f"\nTest Accuracy: {accuracy*100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(all_labels, all_preds, target_names=['Fresh', 'Rotten']))
    
    # Save model
    # Save in both train/models and app/models for compatibility
    train_model_dir = "models"
    app_model_dir = "../app/models"
    
    os.makedirs(train_model_dir, exist_ok=True)
    os.makedirs(app_model_dir, exist_ok=True)
    
    train_model_path = os.path.join(train_model_dir, "spoilage_model.pth")
    app_model_path = os.path.join(app_model_dir, "spoilage_model.pth")
    
    torch.save(model.state_dict(), train_model_path)
    torch.save(model.state_dict(), app_model_path)
    
    print(f"\nModel saved to:")
    print(f"  - {train_model_path}")
    print(f"  - {app_model_path}")
    
    # Also save full model for easier loading
    full_model_path = os.path.join(train_model_dir, "spoilage_model_full.pth")
    torch.save(model, full_model_path)
    print(f"  - {full_model_path} (full model)")
    
    return model

if __name__ == "__main__":
    import argparse
    
    # Get the script's directory to find FruitVision relative to it
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_data_dir = os.path.join(script_dir, "..", "FruitVision")
    default_data_dir = os.path.normpath(default_data_dir)
    
    parser = argparse.ArgumentParser(description='Train spoilage detection model on FruitVision dataset')
    parser.add_argument('--data_dir', type=str, default=default_data_dir, 
                       help=f'Dataset directory (default: {default_data_dir})')
    parser.add_argument('--epochs', type=int, default=20, help='Number of epochs (default: 20)')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size (default: 32)')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate (default: 0.001)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Training Spoilage Detection CNN Model")
    print("=" * 60)
    print(f"Dataset directory: {args.data_dir}")
    print(f"Epochs: {args.epochs}")
    print(f"Batch size: {args.batch_size}")
    print(f"Learning rate: {args.lr}")
    print("=" * 60)
    
    # Train model
    train_model(args.data_dir, args.epochs, args.batch_size, args.lr)

