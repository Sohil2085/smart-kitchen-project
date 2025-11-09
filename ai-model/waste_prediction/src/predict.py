from datetime import datetime
import pandas as pd
import joblib

# Load model and encoders
model = joblib.load("../models/waste_model.pkl")
le_cat = joblib.load("../models/category_encoder.pkl")
le_storage = joblib.load("../models/storage_encoder.pkl")

def predict_waste(item_name, expiry_date, category, storage_condition):
    """
    Predict waste risk for a single item.
    Parameters:
        - item_name (str)
        - expiry_date (str) format "dd-mm-yyyy"
        - category (str)
        - storage_condition (str)
    Returns:
        - risk label: "At Risk" or "Safe"
    """
    expiry_date = datetime.strptime(expiry_date, "%d-%m-%Y")
    days_to_expiry = (expiry_date - datetime.today()).days
    is_expired = int(days_to_expiry < 0)

    # Encode categorical features
    category_encoded = le_cat.transform([category])[0]
    storage_encoded = le_storage.transform([storage_condition])[0]

    # Prepare input for model
    X_new = pd.DataFrame([{
        "days_to_expiry": days_to_expiry,
        "category_encoded": category_encoded,
        "storage_encoded": storage_encoded,
        "is_expired": is_expired
    }])

    # Predict
    risk = model.predict(X_new)[0]
    return "At Risk" if risk == 1 else "Safe"

# Example usage
if __name__ == "__main__":
    test_item = {
        "item_name": "Frozen Milk",
        "expiry_date": "20-09-2025",  # Already expired
        "category": "Dairy",
        "storage_condition": "Fridge"
    }

    risk_label = predict_waste(**test_item)
    print(f"Item: {test_item['item_name']} | Waste Risk: {risk_label}")