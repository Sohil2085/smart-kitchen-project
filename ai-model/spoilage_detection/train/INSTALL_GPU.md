# Installing PyTorch with GPU Support

To train the model on your GPU, you need PyTorch with CUDA support.

## Quick Install (Recommended)

For CUDA 12.1 (most recent GPUs):
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

For CUDA 11.8:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

For CPU only (if no GPU):
```bash
pip install torch torchvision
```

## Install All Dependencies

```bash
cd ai-model/spoilage_detection/train
pip install -r requirements.txt
```

Then install PyTorch with CUDA:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

## Verify GPU Setup

```bash
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

## Start Training

Once PyTorch is installed, run:
```bash
python train_spoilage_model.py --epochs 20 --batch_size 32
```

Or use the batch file:
```bash
start_training_gpu.bat
```

The training script will automatically detect and use your GPU if available!

