import pandas as pd
import joblib

MODEL_PATH = "../models/sales_model.pkl"
DATA_PATH = "../data/processed_sales.csv"

model = joblib.load(MODEL_PATH)

# Try to get training feature names directly from model
try:
    feature_columns = model.feature_names_in_
except AttributeError:
    # fallback: reload from processed_sales.csv
    df = pd.read_csv(DATA_PATH)
    df["lag_1"] = df["quantity_sold"].shift(1)
    df["lag_7"] = df["quantity_sold"].shift(7)
    feature_columns = df.drop(columns=["date", "item_name", "quantity_sold"]).columns.tolist()

def predict_sales(input_dict):
    # Load latest processed sales data
    df = pd.read_csv(DATA_PATH)
    df["lag_1"] = df["quantity_sold"].shift(1)
    df["lag_7"] = df["quantity_sold"].shift(7)

    # Get most recent lags
    last_row = df.dropna().iloc[-1]
    input_dict["lag_1"] = last_row["lag_1"]
    input_dict["lag_7"] = last_row["lag_7"]

    # Convert input to DataFrame
    input_df = pd.DataFrame([input_dict])

    # One-hot encode
    input_df = pd.get_dummies(input_df, columns=["day_of_week", "category", "weather"], drop_first=True)

    # Align with training features
    input_df = input_df.reindex(columns=feature_columns, fill_value=0)

    # Predict
    return model.predict(input_df)[0]


if __name__ == "__main__":
    result = predict_sales({
        "month": 3,
        "is_weekend": 0,
        "day_of_week": "Friday",
        "category": "Fast Food",
        "price": 11,
        "holiday": 0,
        "weather": "Sunny"
    })
    print("🔮 Predicted sales:", result)
