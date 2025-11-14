# Quick Testing Guide

## Quick Test Commands

### 1. Check CSV File Structure
```powershell
python -c "import pandas as pd; df = pd.read_csv('sales_data.csv'); print(f'Records: {len(df)}'); print(f'Date range: {df[\"date\"].min()} to {df[\"date\"].max()}'); print(f'Ingredients: {df[\"ingredient\"].nunique()}')"
```

### 2. Test Data Loading
```powershell
python -c "from utils.data_loader import load_sales_data; df = load_sales_data('sales_data.csv'); print(f'✓ Loaded {len(df)} records')"
```

### 3. Test Ingredient Filtering
```powershell
python -c "from utils.data_loader import load_sales_data, filter_by_ingredient; df = load_sales_data('sales_data.csv'); filtered = filter_by_ingredient(df, 'Chicken'); print(f'✓ Found {len(filtered)} Chicken records')"
```

### 4. Test Full Forecast (No Plot)
```powershell
python forecast.py Chicken --months 1
```

### 5. Test Multiple Ingredients
```powershell
python forecast.py Tomato --months 1
python forecast.py Beef --months 1
python forecast.py Rice --months 1
```

### 6. Test Different Time Periods
```powershell
# 1 month
python forecast.py Chicken --months 1

# 2 months
python forecast.py Chicken --months 2

# 30 days
python forecast.py Chicken --periods 30

# 60 days
python forecast.py Chicken --periods 60
```

### 7. Check Output File
```powershell
python -c "import pandas as pd; df = pd.read_csv('forecast.csv'); print(f'Forecast records: {len(df)}'); print(f'Date range: {df[\"date\"].min()} to {df[\"date\"].max()}'); print(df.head())"
```

### 8. Verify Model Imports
```powershell
python -c "from utils.forecast_model import create_prophet_model; model = create_prophet_model(); print('✓ Prophet model created successfully')"
```

## Expected Results

✅ **All tests should:**
- Load data without errors
- Filter ingredients correctly
- Generate forecasts successfully
- Create forecast.csv file
- Display summary statistics

## Troubleshooting

**If tests fail:**
1. Check if all dependencies are installed: `pip install pandas numpy prophet matplotlib`
2. Verify sales_data.csv exists in the current directory
3. Check Python version: `python --version` (should be 3.7+)

