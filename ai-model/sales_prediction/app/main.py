from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

MODEL_PATH = os.getenv("MODEL_PATH", "models/sales_model.pkl")
DATA_PATH = os.getenv("DATA_PATH", "data/processed_sales.csv")
PORT = int(os.getenv("PORT", 8001))

# Load the model
try:
    model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

# Get training feature names
try:
    feature_columns = model.feature_names_in_
except AttributeError:
    # Fallback: load from dataset
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        raise FileNotFoundError(f"Data file not found at {DATA_PATH}")
    
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month
    df["is_weekend"] = df["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)
    df = df.sort_values(["category", "date"])
    df["lag_1"] = df.groupby("category")["quantity_sold"].shift(1)
    df["lag_7"] = df.groupby("category")["quantity_sold"].shift(7)
    df = pd.get_dummies(df, columns=["day_of_week", "category", "weather"], drop_first=True)
    feature_columns = df.drop(columns=["date", "item_name", "quantity_sold"]).columns.tolist()

class SalesInput(BaseModel):
    month: int
    is_weekend: int
    day_of_week: str
    category: str
    price: float
    holiday: int
    weather: str

def predict_sales(input_dict: dict):
    """
    Predict sales quantity based on input dictionary.
    
    Args:
        input_dict (dict): Input with keys: month, is_weekend, day_of_week, category, price, holiday, weather
    
    Returns:
        float: Predicted quantity_sold
    """
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"Data file not found at {DATA_PATH}")
    
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month
    df["is_weekend"] = df["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)
    df = df.sort_values(["category", "date"])
    df["lag_1"] = df.groupby("category")["quantity_sold"].shift(1)
    df["lag_7"] = df.groupby("category")["quantity_sold"].shift(7)
    
    category_df = df[df["category"] == input_dict["category"]].dropna()
    if category_df.empty:
        input_dict["lag_1"] = 0
        input_dict["lag_7"] = 0
    else:
        last_row = category_df.iloc[-1]
        input_dict["lag_1"] = last_row["lag_1"]
        input_dict["lag_7"] = last_row["lag_7"]
    
    input_df = pd.DataFrame([input_dict])
    categorical_cols = ["day_of_week", "category", "weather"]
    input_df = pd.get_dummies(input_df, columns=categorical_cols, drop_first=True)
    input_df = input_df.reindex(columns=feature_columns, fill_value=0)
    
    try:
        prediction = model.predict(input_df)[0]
        return round(prediction, 2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict")
async def predict(input_data: SalesInput):
    result = predict_sales(input_data.dict())
    return {"predicted_sales": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)