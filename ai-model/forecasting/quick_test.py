"""
Quick test commands for the forecasting system.
Run: python quick_test.py
"""

import pandas as pd
from utils.data_loader import load_sales_data, filter_by_ingredient
from utils.forecast_model import create_prophet_model

print("=" * 60)
print("QUICK TEST - Forecasting System")
print("=" * 60)

# Test 1: Check CSV
print("\n[Test 1] Checking CSV file...")
try:
    df = pd.read_csv('sales_data.csv')
    print(f"✓ CSV loaded: {len(df)} records")
    print(f"✓ Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"✓ Ingredients: {df['ingredient'].nunique()}")
    print(f"✓ Sample ingredients: {', '.join(sorted(df['ingredient'].unique().tolist())[:5])}")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Test 2: Test data loading
print("\n[Test 2] Testing data loading...")
try:
    df = load_sales_data('sales_data.csv')
    print(f"✓ Loaded {len(df)} records")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Test 3: Test ingredient filtering
print("\n[Test 3] Testing ingredient filtering...")
try:
    df = load_sales_data('sales_data.csv')
    filtered = filter_by_ingredient(df, 'Chicken')
    print(f"✓ Found {len(filtered)} Chicken records")
    print(f"✓ Date range for Chicken: {filtered['date'].min()} to {filtered['date'].max()}")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Test 4: Test Prophet model creation
print("\n[Test 4] Testing Prophet model...")
try:
    model = create_prophet_model()
    print("✓ Prophet model created successfully")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Test 5: Check available ingredients
print("\n[Test 5] Available ingredients for testing...")
try:
    df = load_sales_data('sales_data.csv')
    ingredients = sorted(df['ingredient'].unique().tolist())
    print(f"✓ Found {len(ingredients)} ingredients:")
    for i, ing in enumerate(ingredients, 1):
        print(f"  {i:2d}. {ing}")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

print("\n" + "=" * 60)
print("✓ All basic tests passed!")
print("=" * 60)
print("\nNext steps:")
print("  1. Run full forecast: python forecast.py Chicken --months 1")
print("  2. Test different ingredient: python forecast.py Tomato --months 1")
print("  3. Test 2 months: python forecast.py Beef --months 2")
print("=" * 60)

