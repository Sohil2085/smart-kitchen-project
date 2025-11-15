import torch

print("=" * 60)
print("GPU CHECK")
print("=" * 60)
print("PyTorch version:", torch.__version__)
print("CUDA Available:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("CUDA Device:", torch.cuda.get_device_name(0))
    print("CUDA Version:", torch.version.cuda)
    print("GPU Memory:", round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 2), "GB")
    print("\nGPU is ready for training!")
else:
    print("\nNo GPU detected - will use CPU")
print("=" * 60)

