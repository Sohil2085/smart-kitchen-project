import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import logging
import matplotlib.pyplot as plt

from processes import preprocess_sales

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load and preprocess data
df = preprocess_sales(save=False)

# ✅ Remove duplicates
df = df.drop_duplicates()

# ✅ Sort and create lag features
df = df.sort_values(["category", "date"])
df["lag_1"] = df.groupby("category")["quantity_sold"].shift(1)
df["lag_7"] = df.groupby("category")["quantity_sold"].shift(7)

# ✅ Rolling mean and std
df["rolling_3"] = df.groupby("category")["quantity_sold"].transform(lambda x: x.shift(1).rolling(3).mean())
df["rolling_std_3"] = df.groupby("category")["quantity_sold"].transform(lambda x: x.shift(1).rolling(3).std())

# ✅ Normalize price within category
df["price_normalized"] = df["price"] / df.groupby("category")["price"].transform("max")

# Fill missing values with category mean
for col in ["lag_1", "lag_7", "rolling_3", "rolling_std_3"]:
    for category in df["category"].unique():
        mask = df["category"] == category
        mean_val = df.loc[mask, "quantity_sold"].mean()
        df.loc[mask, col] = df.loc[mask, col].fillna(mean_val)

# Drop any remaining NaNs
df = df.dropna()

# ✅ Interaction feature
df["holiday_weekend"] = df["holiday"] & df["is_weekend"]

# Features & target
features = [
    "month", "is_weekend", "holiday", "holiday_weekend",
    "day_of_week", "category", "weather",
    "price_normalized", "lag_1", "lag_7",
    "rolling_3", "rolling_std_3"
]
X = df[features]
y = df["quantity_sold"]

# One-hot encoding
X = pd.get_dummies(X, columns=["day_of_week", "category", "weather"], drop_first=True)

# Train-test split (preserve time order)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

# ✅ Random Forest setup
model = RandomForestRegressor(
    n_estimators=300,
    max_depth=15,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42
)

# Train on full training set
model.fit(X_train, y_train)

# ✅ Feature importance pruning
importances = pd.Series(model.feature_importances_, index=X.columns)
low_importance = importances[importances < 0.001].index
if not low_importance.empty:
    logger.info(f"🔍 Dropping low-importance features: {list(low_importance)}")
    X_train = X_train.drop(columns=low_importance)
    X_test = X_test.drop(columns=low_importance)
    model.fit(X_train, y_train)

# Evaluation on test set
y_pred = model.predict(X_test)
logger.info(f"Test MAE: {mean_absolute_error(y_test, y_pred):.2f}")
logger.info(f"Test R²: {r2_score(y_test, y_pred):.3f}")

# ✅ Stratified evaluation by sales bucket
def evaluate_by_bucket(y_true, y_pred):
    df_eval = pd.DataFrame({"actual": y_true, "predicted": y_pred})
    df_eval["bucket"] = pd.cut(df_eval["actual"], bins=[-1, 10, 30, 100], labels=["Low", "Medium", "High"])
    for bucket in df_eval["bucket"].unique():
        subset = df_eval[df_eval["bucket"] == bucket]
        if not subset.empty:
            mae = mean_absolute_error(subset["actual"], subset["predicted"])
            logger.info(f"{bucket} Sales - MAE: {mae:.2f}, Count: {len(subset)}")

evaluate_by_bucket(y_test, y_pred)

# ✅ Final feature importance
final_importances = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
logger.info("📊 Final Feature Importances:")
for feature, score in final_importances.items():
    logger.info(f"{feature}: {score:.4f}")

# ✅ Visualize prediction errors
plt.figure(figsize=(8, 6))
plt.scatter(y_test, y_pred, alpha=0.6, edgecolors='k')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')  # ideal line
plt.xlabel("Actual Sales")
plt.ylabel("Predicted Sales")
plt.title("Actual vs Predicted Sales")
plt.grid(True)
plt.tight_layout()
plt.show()

# Save model
joblib.dump(model, "../models/sales_model.pkl")
logger.info("✅ Model saved to ../models/sales_model.pkl")