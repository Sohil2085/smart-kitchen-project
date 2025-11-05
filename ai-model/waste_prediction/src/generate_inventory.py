import pandas as pd
import random
from datetime import datetime, timedelta

# Food items and adjectives
items = ['Tomato', 'Milk', 'Cheese', 'Chicken', 'Bread', 'Lettuce', 'Butter', 'Fish', 'Yogurt', 'Bacon', 'Spinach', 'Eggs', 'Burger Patty', 'Cucumber', 'Tomato Sauce']
adjectives = ['Fresh', 'Organic', 'Frozen', 'Large', 'Small', 'Premium', 'Local']

categories = ['Vegetable', 'Dairy', 'Meat', 'Fast Food']
storage_conditions = ['Fridge', 'Freezer', 'Pantry']

data = []

for i in range(1000):  # number of rows
    item_name = f"{random.choice(adjectives)} {random.choice(items)}"
    expiry_date = (datetime.today() + timedelta(days=random.randint(0, 20))).strftime("%d-%m-%Y")
    category = random.choice(categories)
    storage = random.choice(storage_conditions)
    
    # Simple rule for waste risk
    days_to_expiry = (datetime.strptime(expiry_date, "%d-%m-%Y") - datetime.today()).days
    waste_risk = 1 if days_to_expiry <= 3 else 0
    
    data.append([item_name, expiry_date, category, storage, waste_risk])

df = pd.DataFrame(data, columns=['item_name','expiry_date','category','storage_condition','waste_risk'])
df.to_csv("inventory.csv", index=False)
print("✅ inventory.csv generated with realistic item names!")
