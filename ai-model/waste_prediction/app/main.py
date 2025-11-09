# main.py

from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from datetime import datetime
import joblib
from sklearn.preprocessing import LabelEncoder
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Smart Kitchen Waste Prediction API")

# -------------------------
# Load trained model and encoders
# -------------------------
MODEL_PATH = os.getenv("MODEL_PATH", "../models/waste_model.pkl")
DATA_PATH = os.getenv("DATA_PATH", "../data/inventory.csv")
PORT = int(os.getenv("PORT", 8002))

model = joblib.load(MODEL_PATH)  # trained in .ipynb

# Load original dataset to fit encoders (must match training)
df = pd.read_csv(DATA_PATH)
le_cat = LabelEncoder()
le_storage = LabelEncoder()
le_cat.fit(df["category"])
le_storage.fit(df["storage_condition"])

# -------------------------
# Prediction function
# -------------------------
def predict_waste(item_name, expiry_date, quantity, used_quantity, category, storage_condition):
    expiry_date = datetime.strptime(expiry_date, "%d-%m-%Y")
    days_to_expiry = (expiry_date - datetime.today()).days

    category_encoded = le_cat.transform([category])[0]
    storage_encoded = le_storage.transform([storage_condition])[0]

    X_new = pd.DataFrame([{
        "days_to_expiry": days_to_expiry,
        "quantity": quantity,
        "used_quantity": used_quantity,
        "category_encoded": category_encoded,
        "storage_encoded": storage_encoded
    }])

    prediction = model.predict(X_new)[0]
    return prediction

# -------------------------
# Pydantic model for request
# -------------------------
class Item(BaseModel):
    item_name: str
    expiry_date: str        # format: "dd-mm-yyyy"
    quantity: int
    used_quantity: float
    category: str
    storage_condition: str

# -------------------------
# Health check endpoint
# -------------------------
@app.get("/health")
def health_check():
    return {"status": "API is running"}

# -------------------------
# Prediction endpoint
# -------------------------
@app.post("/predict")
def predict(item: Item):
    risk = predict_waste(
        item_name=item.item_name,
        expiry_date=item.expiry_date,
        quantity=item.quantity,
        used_quantity=item.used_quantity,
        category=item.category,
        storage_condition=item.storage_condition
    )
    return {
        "item_name": item.item_name,
        "waste_risk": "At Risk" if risk == 1 else "Safe"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
