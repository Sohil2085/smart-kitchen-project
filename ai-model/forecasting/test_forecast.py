"""
Quick test script to verify the forecasting system works correctly.
"""

import sys
import subprocess

def run_test(description, command):
    """Run a test command and display results."""
    print("\n" + "=" * 60)
    print(f"TEST: {description}")
    print("=" * 60)
    print(f"Command: {command}")
    print("-" * 60)
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("✓ PASSED")
            print("\nOutput:")
            print(result.stdout)
        else:
            print("✗ FAILED")
            print("\nError:")
            print(result.stderr)
            return False
    except subprocess.TimeoutExpired:
        print("✗ TIMEOUT - Command took too long")
        return False
    except Exception as e:
        print(f"✗ ERROR: {str(e)}")
        return False
    
    return True

def main():
    """Run all tests."""
    print("=" * 60)
    print("FORECASTING SYSTEM TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Check if forecast.py exists", "python -c \"import sys; sys.path.insert(0, '.'); from forecast import main; print('forecast.py imported successfully')\""),
        ("Test data loading - Check CSV file", "python -c \"import pandas as pd; df = pd.read_csv('sales_data.csv'); print(f'CSV loaded: {len(df)} records'); print(f'Date range: {df[\"date\"].min()} to {df[\"date\"].max()}'); print(f'Ingredients: {df[\"ingredient\"].nunique()}')\""),
        ("Test ingredient filtering", "python -c \"from utils.data_loader import load_sales_data, filter_by_ingredient; df = load_sales_data('sales_data.csv'); filtered = filter_by_ingredient(df, 'Chicken'); print(f'Chicken records found: {len(filtered)}')\""),
        ("Test monthly forecast - Chicken (dry run)", "python forecast.py Chicken --months 1 --output test_forecast.csv 2>&1 | Select-Object -First 25"),
    ]
    
    passed = 0
    failed = 0
    
    for description, command in tests:
        if run_test(description, command):
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Passed: {passed}/{len(tests)}")
    print(f"Failed: {failed}/{len(tests)}")
    print("=" * 60)
    
    if failed == 0:
        print("\n✓ All tests passed! System is ready to use.")
    else:
        print("\n⚠ Some tests failed. Please check the errors above.")

if __name__ == '__main__':
    main()

