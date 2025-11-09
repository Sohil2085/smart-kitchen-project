import pandas as pd
import os

def preprocess_sales(file_path="../data/raw_sales.csv", save_path="../data/processed_sales.csv", save=True):
    # Debug: show the file being read
    print(f"📂 Reading data from: {os.path.abspath(file_path)}")

    df = pd.read_csv(file_path)

    # Convert date column
    df["date"] = pd.to_datetime(df["date"])

    # Extract time features
    df["day_of_week"] = df["date"].dt.day_name()
    df["month"] = df["date"].dt.month
    df["is_weekend"] = df["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)

    # Handle missing values (fill with 0 for sales)
    df["quantity_sold"] = df["quantity_sold"].fillna(0)

    # Save processed file
    df.to_csv(save_path, index=False)
    print(f"✅ Processed data saved to {os.path.abspath(save_path)}")

    return df


if __name__ == "__main__":
    preprocess_sales()
