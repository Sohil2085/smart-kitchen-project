"""
Sales Forecasting CLI script using Prophet.
Usage: python forecast.py [ingredient_name]
"""

import sys
import argparse
import matplotlib.pyplot as plt
import pandas as pd

from utils.data_loader import (
    load_sales_data,
    preprocess_data,
    filter_by_ingredient,
    aggregate_daily_sales
)
from utils.forecast_model import (
    create_prophet_model,
    train_model,
    make_forecast,
    save_forecast,
    get_monthly_summary
)


def plot_forecast(historical_data, forecast_df, ingredient_name=None):
    """
    Plot historical data and forecast.
    
    Args:
        historical_data (pd.DataFrame): Historical sales data
        forecast_df (pd.DataFrame): Forecast data
        ingredient_name (str): Optional ingredient name for plot title
    """
    plt.figure(figsize=(12, 6))
    
    # Plot historical data
    plt.plot(historical_data['ds'], historical_data['y'], 
             label='Historical Sales', marker='o', markersize=3, linewidth=1.5)
    
    # Plot forecast
    plt.plot(forecast_df['date'], forecast_df['forecast'], 
             label='Forecast', marker='s', markersize=3, linewidth=1.5, color='orange')
    
    # Plot confidence intervals
    plt.fill_between(forecast_df['date'], 
                     forecast_df['forecast_lower'], 
                     forecast_df['forecast_upper'],
                     alpha=0.3, color='orange', label='95% Confidence Interval')
    
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('Sales/Consumption', fontsize=12)
    
    title = 'Sales Forecast'
    if ingredient_name:
        title += f' - {ingredient_name}'
    plt.title(title, fontsize=14, fontweight='bold')
    
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()


def main():
    """Main function to run the forecasting pipeline."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Sales Forecasting using Prophet')
    parser.add_argument('ingredient', nargs='?', default=None,
                       help='Name of ingredient to forecast (optional)')
    parser.add_argument('--data', default='sales_data.csv',
                       help='Path to sales data CSV file (default: sales_data.csv)')
    parser.add_argument('--output', default='forecast.csv',
                       help='Path to save forecast CSV (default: forecast.csv)')
    parser.add_argument('--periods', type=int, default=None,
                       help='Number of days to forecast (overrides --months if both specified)')
    parser.add_argument('--months', type=int, default=None,
                       help='Number of months to forecast (e.g., 1 for next month, 2 for 2 months)')
    
    args = parser.parse_args()
    
    # Calculate periods from months if specified
    if args.periods is None:
        if args.months is not None:
            args.periods = args.months * 30  # Approximate 30 days per month
        else:
            args.periods = 30  # Default to 30 days
    
    try:
        # Step 1: Load sales data
        print(f"Loading sales data from {args.data}...")
        sales_data = load_sales_data(args.data)
        print(f"Loaded {len(sales_data)} records")
        
        # Step 2: Filter by ingredient if provided
        if args.ingredient:
            print(f"Filtering data for ingredient: {args.ingredient}...")
            sales_data = filter_by_ingredient(sales_data, args.ingredient)
            print(f"Found {len(sales_data)} records for {args.ingredient}")
        
        # Step 3: Preprocess data
        print("Preprocessing data...")
        processed_data = preprocess_data(sales_data)
        print(f"Processed {len(processed_data)} records")
        
        # Step 4: Aggregate daily sales
        historical_data = aggregate_daily_sales(processed_data)
        print(f"Aggregated to {len(historical_data)} daily records")
        
        if len(historical_data) < 2:
            raise ValueError("Not enough historical data. Need at least 2 days of data.")
        
        # Step 5: Create and train Prophet model
        print("Creating Prophet model...")
        model = create_prophet_model()
        
        print("Training model...")
        model = train_model(model, historical_data)
        print("Model trained successfully!")
        
        # Step 6: Generate forecast
        print(f"Generating {args.periods}-day forecast...")
        forecast_df = make_forecast(model, periods=args.periods)
        print(f"Generated forecast for {len(forecast_df)} days")
        
        # Step 7: Save forecast
        save_forecast(forecast_df, args.output)
        
        # Step 8: Display summary statistics
        print("\n=== Forecast Summary ===")
        print(f"Forecast period: {len(forecast_df)} days")
        print(f"Forecast dates: {forecast_df['date'].min()} to {forecast_df['date'].max()}")
        print(f"\nDaily Statistics:")
        print(f"  Average daily forecast: {forecast_df['forecast'].mean():.2f}")
        print(f"  Daily range: {forecast_df['forecast'].min():.2f} - {forecast_df['forecast'].max():.2f}")
        print(f"  Total forecast ({len(forecast_df)} days): {forecast_df['forecast'].sum():.2f}")
        
        # Show monthly summary if forecasting for a month or more
        if args.months or args.periods >= 28:
            monthly_summary = get_monthly_summary(forecast_df)
            print(f"\nMonthly Summary:")
            for _, row in monthly_summary.iterrows():
                print(f"  {row['year_month']}:")
                print(f"    Total: {row['total']:.2f} (Range: {row['total_lower']:.2f} - {row['total_upper']:.2f})")
                print(f"    Daily Avg: {row['daily_avg']:.2f} (Min: {row['daily_min']:.2f}, Max: {row['daily_max']:.2f})")
        
        # Step 9: Plot forecast
        print("\nDisplaying forecast plot...")
        plot_forecast(historical_data, forecast_df, args.ingredient)
        
        print("\nForecasting complete!")
        
    except FileNotFoundError as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: An unexpected error occurred: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

