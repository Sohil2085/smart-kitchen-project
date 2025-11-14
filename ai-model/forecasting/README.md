# Sales Forecasting with Prophet

A simple and beginner-friendly Python script for predicting ingredient consumption based on historical sales data using Facebook's Prophet forecasting library.

## Features

- 📊 Predict ingredient consumption for the next 30 days
- 🔍 Filter forecasts by specific ingredients
- 📈 Visualize forecasts with matplotlib plots
- 🛡️ Graceful error handling for missing data
- 📝 Clean and well-commented code

## Requirements

Install the required dependencies:

```bash
pip install pandas numpy prophet matplotlib
```

Or using a requirements file:

```bash
pip install -r requirements.txt
```

## Project Structure

```
forecasting/
├── forecast.py              # Main CLI script
├── sales_data.csv          # Sample sales data
├── forecast.csv            # Generated forecast output
├── README.md               # This file
└── utils/
    ├── data_loader.py      # Data loading and preprocessing utilities
    └── forecast_model.py   # Prophet model utilities
```

## Usage

### Basic Usage

Run the forecast script for a specific ingredient:

```bash
python forecast.py Tomato
```

This will:
1. Load sales data from `sales_data.csv`
2. Filter data for "Tomato"
3. Train a Prophet model
4. Generate a 30-day forecast
5. Save results to `forecast.csv`
6. Display a forecast plot

### Advanced Usage

Forecast for a different ingredient:

```bash
python forecast.py Onion
python forecast.py Carrot
```

Use custom data file:

```bash
python forecast.py Tomato --data custom_sales_data.csv
```

Customize forecast period:

```bash
python forecast.py Tomato --periods 60
```

Customize output file:

```bash
python forecast.py Tomato --output my_forecast.csv
```

View all options:

```bash
python forecast.py --help
```

## Data Format

The `sales_data.csv` file should contain the following columns:

- **date**: Date in format YYYY-MM-DD (or any pandas-readable date format)
- **ingredient**: Name of the ingredient (e.g., "Tomato", "Onion")
- **sales**: Sales/consumption quantity (numeric)

Example:

```csv
date,ingredient,sales
2023-01-01,Tomato,120
2023-01-02,Tomato,135
2023-01-03,Tomato,142
```

**Note**: The script is flexible and will try to automatically detect column names even if they're slightly different (e.g., "Date", "Item", "Quantity").

## Output

The script generates:

1. **forecast.csv**: Contains the forecast with columns:
   - `date`: Forecast dates
   - `forecast`: Predicted sales/consumption
   - `forecast_lower`: Lower bound (95% confidence interval)
   - `forecast_upper`: Upper bound (95% confidence interval)

2. **Matplotlib Plot**: Visual representation showing:
   - Historical sales data
   - Forecasted values
   - 95% confidence intervals

## Model Configuration

The Prophet model is configured with:

- **Daily seasonality**: Enabled
- **Weekly seasonality**: Enabled
- **Yearly seasonality**: Enabled
- **Seasonality mode**: Multiplicative (suitable for sales data)
- **Confidence interval**: 95%

## Error Handling

The script handles common errors gracefully:

- Missing data files → Clear error message
- Invalid ingredient names → Lists available ingredients
- Insufficient data → Requires at least 2 days of historical data
- Missing columns → Auto-detects common column name variations

## Example Output

```
Loading sales data from sales_data.csv...
Loaded 365 records
Filtering data for ingredient: Tomato...
Found 122 records for Tomato
Preprocessing data...
Processed 122 records
Aggregated to 122 daily records
Creating Prophet model...
Training model...
Model trained successfully!
Generating 30-day forecast...
Generated forecast for 30 days
Forecast saved to forecast.csv

=== Forecast Summary ===
Average daily forecast: 245.67
Total forecast (30 days): 7370.10
Forecast range: 228.45 - 268.92

Displaying forecast plot...

Forecasting complete!
```

## Tips

1. **More data = Better forecasts**: The model performs better with more historical data (ideally 6+ months)

2. **Data quality**: Ensure your dates are consecutive and there are no major gaps

3. **Missing ingredients**: If you get an error about a missing ingredient, check the available ingredients in your data file

4. **Seasonal patterns**: The model automatically detects daily, weekly, and yearly patterns in your data

## Troubleshooting

**ImportError: No module named 'prophet'**
- Install Prophet: `pip install prophet`

**ValueError: Ingredient not found**
- Check available ingredients in your CSV file
- Ensure ingredient names match exactly (case-insensitive)

**FileNotFoundError: Sales data file not found**
- Ensure `sales_data.csv` is in the same directory as `forecast.py`
- Or specify the correct path using `--data` option

## License

This project is part of the Smart Kitchen project.

