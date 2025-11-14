"""
Data loading and preprocessing utilities for sales forecasting.
"""

import pandas as pd
import numpy as np


def load_sales_data(filepath='sales_data.csv'):
    """
    Load sales data from CSV file.
    
    Args:
        filepath (str): Path to the sales data CSV file
        
    Returns:
        pd.DataFrame: Loaded sales data
    """
    try:
        df = pd.read_csv(filepath)
        return df
    except FileNotFoundError:
        raise FileNotFoundError(f"Sales data file not found: {filepath}")
    except Exception as e:
        raise Exception(f"Error loading sales data: {str(e)}")


def preprocess_data(df):
    """
    Preprocess sales data: parse dates and prepare for Prophet.
    
    Args:
        df (pd.DataFrame): Raw sales data
        
    Returns:
        pd.DataFrame: Preprocessed data with 'ds' (date) and 'y' (sales) columns
    """
    # Copy dataframe to avoid modifying original
    data = df.copy()
    
    # Convert date column to datetime
    # Try common date column names
    date_columns = ['date', 'Date', 'DATE', 'ds', 'timestamp', 'Timestamp']
    date_col = None
    
    for col in date_columns:
        if col in data.columns:
            date_col = col
            break
    
    if date_col is None:
        # If no date column found, try the first column
        date_col = data.columns[0]
    
    # Parse date column
    data['ds'] = pd.to_datetime(data[date_col], errors='coerce')
    
    # Find sales/quantity column
    sales_columns = ['sales', 'Sales', 'SALES', 'quantity', 'Quantity', 'y', 'consumption']
    sales_col = None
    
    for col in sales_columns:
        if col in data.columns and col != date_col:
            sales_col = col
            break
    
    if sales_col is None:
        # If no sales column found, try the second column
        available_cols = [c for c in data.columns if c != date_col]
        if available_cols:
            sales_col = available_cols[0]
        else:
            raise ValueError("Could not find sales/quantity column in data")
    
    # Create Prophet-compatible dataframe
    prophet_data = pd.DataFrame({
        'ds': data['ds'],
        'y': pd.to_numeric(data[sales_col], errors='coerce')
    })
    
    # Remove rows with missing dates or sales values
    prophet_data = prophet_data.dropna()
    
    # Sort by date
    prophet_data = prophet_data.sort_values('ds').reset_index(drop=True)
    
    # Ensure sales values are non-negative
    prophet_data['y'] = np.maximum(prophet_data['y'], 0)
    
    return prophet_data


def filter_by_ingredient(df, ingredient_name):
    """
    Filter sales data by ingredient name.
    
    Args:
        df (pd.DataFrame): Original sales data
        ingredient_name (str): Name of ingredient to filter by
        
    Returns:
        pd.DataFrame: Filtered data for the specified ingredient
    """
    # Try common ingredient column names
    ingredient_columns = ['ingredient', 'Ingredient', 'INGREDIENT', 'item', 'Item', 'product', 'Product']
    ingredient_col = None
    
    for col in ingredient_columns:
        if col in df.columns:
            ingredient_col = col
            break
    
    if ingredient_col is None:
        # If no ingredient column found, check all columns
        raise ValueError("Could not find ingredient/item column in data")
    
    # Filter by ingredient name (case-insensitive)
    filtered = df[df[ingredient_col].str.lower() == ingredient_name.lower()].copy()
    
    if filtered.empty:
        available_ingredients = df[ingredient_col].unique().tolist()
        raise ValueError(
            f"Ingredient '{ingredient_name}' not found in data. "
            f"Available ingredients: {', '.join(map(str, available_ingredients))}"
        )
    
    return filtered


def aggregate_daily_sales(df):
    """
    Aggregate sales by date (in case there are multiple entries per day).
    
    Args:
        df (pd.DataFrame): Preprocessed data with 'ds' and 'y' columns
        
    Returns:
        pd.DataFrame: Daily aggregated data
    """
    # Group by date and sum sales
    daily_data = df.groupby('ds')['y'].sum().reset_index()
    daily_data = daily_data.sort_values('ds').reset_index(drop=True)
    
    return daily_data

