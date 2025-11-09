import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, cross_val_predict
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix
import matplotlib.pyplot as plt
import joblib

# Load dataset
df = pd.read_csv("../data/inventory.csv")

# Encode categorical columns
le_cat = LabelEncoder()
le_storage = LabelEncoder()
df['category_encoded'] = le_cat.fit_transform(df['category'])
df['storage_encoded'] = le_storage.fit_transform(df['storage_condition'])

# Calculate days_to_expiry
df['expiry_date'] = pd.to_datetime(df['expiry_date'], format="%d-%m-%Y")
df['days_to_expiry'] = (df['expiry_date'] - pd.Timestamp.today()).dt.days

# Add binary feature: is_expired
df['is_expired'] = (df['days_to_expiry'] < 0).astype(int)

# Select features (based on heatmap + expired logic)
features = ['days_to_expiry', 'category_encoded', 'storage_encoded', 'is_expired']
X = df[features]
y = df['waste_risk']  # 1=At Risk, 0=Safe

# Cross-validation
model_cv = RandomForestClassifier(n_estimators=100, random_state=42)
cv_scores = cross_val_score(model_cv, X, y, cv=5)
cv_preds = cross_val_predict(model_cv, X, y, cv=5)

print("Cross-Validation Accuracy Scores:", cv_scores)
print("Mean CV Accuracy:", cv_scores.mean())
print("Cross-Validation Confusion Matrix:\n", confusion_matrix(y, cv_preds))

# Train-test split for final model
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train final model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("Holdout Accuracy:", accuracy_score(y_test, y_pred))
print("Holdout Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

# 🔍 Feature Importance
importances = model.feature_importances_
for name, score in zip(features, importances):
    print(f"{name}: {score:.4f}")

# 📊 Visualize Feature Importance
plt.figure(figsize=(6, 4))
plt.barh(features, importances, color='skyblue')
plt.xlabel("Feature Importance")
plt.title("Random Forest Feature Importance")
plt.gca().invert_yaxis()
plt.tight_layout()
plt.show()

# Save model & encoders
joblib.dump(model, "../models/waste_model.pkl")
joblib.dump(le_cat, "../models/category_encoder.pkl")
joblib.dump(le_storage, "../models/storage_encoder.pkl")
print("✅ Waste prediction model saved with 4 features including expiry flag!")