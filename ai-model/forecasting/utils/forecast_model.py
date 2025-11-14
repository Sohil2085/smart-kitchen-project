"""
Prophet forecasting model utilities.
"""

from prophet import Prophet
import pandas as pd
import numpy as np


def create_prophet_model():
    """
    Create and configure a Prophet model with daily and yearly seasonality.
    
    Returns:
        Prophet: Configured Prophet model
    """
    model = Prophet(
        daily_seasonality=True,      # Enable daily seasonality
        yearly_seasonality=True,     # Enable yearly seasonality
        weekly_seasonality=True,     # Enable weekly seasonality
        seasonality_mode='multiplicative',  # Multiplicative seasonality for sales data
        interval_width=0.95          # 95% confidence intervals
    )
    
    return model


def train_model(model, data):
    """
    Train Prophet model on historical data.
    
    Args:
        model (Prophet): Prophet model instance
        data (pd.DataFrame): Training data with 'ds' and 'y' columns
        
    Returns:
        Prophet: Trained model
    """
    if len(data) < 2:
        raise ValueError("Need at least 2 data points to train the model")
    
    # Fit the model
    model.fit(data)
    
    return model


def make_forecast(model, periods=30):
    """
    Generate forecast for future periods.
    
    Args:
        model (Prophet): Trained Prophet model
        periods (int): Number of future days to forecast
        
    Returns:
        pd.DataFrame: Forecast dataframe with 'ds', 'yhat', 'yhat_lower', 'yhat_upper'
    """
    # Create future dataframe
    future = model.make_future_dataframe(periods=periods)
    
    # Generate forecast
    forecast = model.predict(future)
    
    # Return only future forecast (last 'periods' rows)
    future_forecast = forecast.tail(periods).copy()
    
    # Select relevant columns
    forecast_df = future_forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
    
    # Rename columns for clarity
    forecast_df.columns = ['date', 'forecast', 'forecast_lower', 'forecast_upper']
    
    # Ensure non-negative forecasts
    forecast_df['forecast'] = np.maximum(forecast_df['forecast'], 0)
    forecast_df['forecast_lower'] = np.maximum(forecast_df['forecast_lower'], 0)
    forecast_df['forecast_upper'] = np.maximum(forecast_df['forecast_upper'], 0)
    
    return forecast_df


def save_forecast(forecast_df, filepath='forecast.csv'):
    """
    Save forecast to CSV file.
    
    Args:
        forecast_df (pd.DataFrame): Forecast dataframe
        filepath (str): Path to save the forecast CSV
    """
    forecast_df.to_csv(filepath, index=False)
    print(f"Forecast saved to {filepath}")


def get_monthly_summary(forecast_df):
    """
    Calculate monthly summary statistics from forecast.
    
    Args:
        forecast_df (pd.DataFrame): Forecast dataframe with 'date' and 'forecast' columns
        
    Returns:
        pd.DataFrame: Monthly aggregated forecast with totals
    """
    # Ensure date is datetime
    forecast_df = forecast_df.copy()
    forecast_df['date'] = pd.to_datetime(forecast_df['date'])
    
    # Extract year-month
    forecast_df['year_month'] = forecast_df['date'].dt.to_period('M')
    
    # Group by month and calculate totals
    monthly_summary = forecast_df.groupby('year_month').agg({
        'forecast': ['sum', 'mean', 'min', 'max'],
        'forecast_lower': 'sum',
        'forecast_upper': 'sum'
    }).round(2)
    
    # Flatten column names
    monthly_summary.columns = ['total', 'daily_avg', 'daily_min', 'daily_max', 'total_lower', 'total_upper']
    monthly_summary = monthly_summary.reset_index()
    monthly_summary['year_month'] = monthly_summary['year_month'].astype(str)
    
    return monthly_summary

