# Terminal Testing Guide

## Quick Tests (Copy & Paste)

### 1. Basic System Check
```powershell
python quick_test.py
```
**Expected:** ✓ All basic tests passed!

---

### 2. Test Forecast - Chicken (1 month)
```powershell
python forecast.py Chicken --months 1
```
**Expected:** 
- Forecast generated for 30 days
- forecast.csv created
- Plot displayed
- Monthly summary shown

---

### 3. Test Forecast - Tomato (1 month)
```powershell
python forecast.py Tomato --months 1
```

---

### 4. Test Forecast - Beef (2 months)
```powershell
python forecast.py Beef --months 2
```

---

### 5. Test Forecast - Rice (custom 60 days)
```powershell
python forecast.py Rice --periods 60
```

---

### 6. Check Generated Forecast File
Create a file `check_forecast.py`:
```python
import pandas as pd
df = pd.read_csv('forecast.csv')
print(f'Forecast records: {len(df)}')
print(f'Date range: {df["date"].min()} to {df["date"].max()}')
print('\nFirst 5 days:')
print(df.head(5))
```
Then run: `python check_forecast.py`

---

### 7. Test All Ingredient Types

**Proteins:**
```powershell
python forecast.py Chicken --months 1
python forecast.py Beef --months 1
python forecast.py Fish --months 1
```

**Vegetables:**
```powershell
python forecast.py Tomato --months 1
python forecast.py Onion --months 1
python forecast.py Carrot --months 1
```

**Dairy:**
```powershell
python forecast.py Cheese --months 1
python forecast.py Milk --months 1
```

---

## Test Checklist

- [ ] Run `python quick_test.py` - All tests pass
- [ ] Test 1 ingredient forecast (Chicken)
- [ ] Verify forecast.csv is created
- [ ] Test different ingredient (Tomato)
- [ ] Test 2-month forecast
- [ ] Check forecast output file exists

---

## Expected Output Format

When running a forecast, you should see:
```
Loading sales data from sales_data.csv...
Loaded 31950 records
Filtering data for ingredient: Chicken...
Found 1065 records for Chicken
Preprocessing data...
Processed 1065 records
Aggregated to 1065 daily records
Creating Prophet model...
Training model...
Model trained successfully!
Generating 30-day forecast...
Generated forecast for 30 days
Forecast saved to forecast.csv

=== Forecast Summary ===
Forecast period: 30 days
Forecast dates: 2025-12-01 to 2025-12-30

Daily Statistics:
  Average daily forecast: 210.45
  Daily range: 180.20 - 245.80
  Total forecast (30 days): 6313.50

Monthly Summary:
  2025-12:
    Total: 6313.50 (Range: 5800.20 - 6850.30)
    Daily Avg: 210.45 (Min: 180.20, Max: 245.80)

Displaying forecast plot...
```

---

## Troubleshooting

**Error: Module not found**
```powershell
pip install pandas numpy prophet matplotlib
```

**Error: File not found**
- Make sure you're in the `forecasting` directory
- Check that `sales_data.csv` exists

**Error: Ingredient not found**
- Check available ingredients: `python quick_test.py`
- Use exact ingredient name (case-insensitive)

---

## Success Criteria

✅ All tests pass  
✅ Forecasts generate without errors  
✅ CSV files are created  
✅ Plots display correctly  
✅ Monthly summaries show accurate totals

