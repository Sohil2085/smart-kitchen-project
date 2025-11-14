"""Quick script to check the generated forecast.csv file."""
import pandas as pd
import sys

try:
    df = pd.read_csv('forecast.csv')
    print("=" * 60)
    print("FORECAST FILE CHECK")
    print("=" * 60)
    print(f"Forecast records: {len(df)}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"\nColumns: {list(df.columns)}")
    print(f"\nFirst 5 days:")
    print(df.head(5))
    print(f"\nLast 5 days:")
    print(df.tail(5))
    print(f"\nStatistics:")
    print(f"  Average forecast: {df['forecast'].mean():.2f}")
    print(f"  Total forecast: {df['forecast'].sum():.2f}")
    print(f"  Min: {df['forecast'].min():.2f}")
    print(f"  Max: {df['forecast'].max():.2f}")
    print("=" * 60)
except FileNotFoundError:
    print("Error: forecast.csv not found. Run a forecast first!")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

