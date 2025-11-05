# Inventory Management System API Documentation

## Overview
This API provides comprehensive inventory management functionality for a smart kitchen system. Only users with admin@gmail.com or chef@gmail.com email addresses can access the inventory features.

## Authentication
- **Admin Email**: admin@gmail.com
- **Chef Email**: chef@gmail.com
- **Default Passwords**: 
  - Admin: admin123
  - Chef: chef123

## Base URL
```
http://localhost:3000/api/v1
```

## User Management Endpoints

### 1. Create Default Users
**POST** `/user/create-default-users`

Creates the default admin and chef users if they don't exist.

**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Default users created successfully",
  "success": true
}
```

### 2. User Login
**POST** `/user/login`

**Request Body:**
```json
{
  "email": "admin@gmail.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "user_id",
    "fullname": "Admin User",
    "email": "admin@gmail.com",
    "username": "admin",
    "role": "admin"
  },
  "message": "Login successful",
  "success": true
}
```

## Inventory Management Endpoints

### 1. Get All Inventory Items
**GET** `/inventory`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category
- `status` (optional): Filter by status
- `storageCondition` (optional): Filter by storage condition
- `search` (optional): Search by item name

**Example:**
```
GET /inventory?page=1&limit=10&category=vegetables&search=tomato
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "docs": [
      {
        "_id": "item_id",
        "name": "Tomatoes",
        "quantity": 50,
        "unit": "kg",
        "addedDate": "2024-01-15T10:30:00.000Z",
        "expiryDate": "2024-01-25T00:00:00.000Z",
        "storageCondition": "fridge",
        "category": "vegetables",
        "supplier": "Fresh Farm",
        "cost": 25.50,
        "minThreshold": 10,
        "maxThreshold": 100,
        "status": "active",
        "notes": "Organic tomatoes",
        "addedBy": {
          "_id": "user_id",
          "fullname": "Chef User",
          "email": "chef@gmail.com",
          "role": "chef"
        }
      }
    ],
    "totalDocs": 1,
    "limit": 10,
    "page": 1,
    "totalPages": 1
  },
  "message": "Inventory items retrieved successfully",
  "success": true
}
```

### 2. Get Single Inventory Item
**GET** `/inventory/:id`

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "item_id",
    "name": "Tomatoes",
    "quantity": 50,
    "unit": "kg",
    "addedDate": "2024-01-15T10:30:00.000Z",
    "expiryDate": "2024-01-25T00:00:00.000Z",
    "storageCondition": "fridge",
    "category": "vegetables",
    "supplier": "Fresh Farm",
    "cost": 25.50,
    "minThreshold": 10,
    "maxThreshold": 100,
    "status": "active",
    "notes": "Organic tomatoes",
    "addedBy": {
      "_id": "user_id",
      "fullname": "Chef User",
      "email": "chef@gmail.com",
      "role": "chef"
    }
  },
  "message": "Inventory item retrieved successfully",
  "success": true
}
```

### 3. Add New Inventory Item
**POST** `/inventory`

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `name`: "Carrots" (text)
- `quantity`: 30 (number)
- `unit`: "kg" (text)
- `expiryDate`: "2024-02-15" (text)
- `storageCondition`: "fridge" (text)
- `category`: "vegetables" (text)
- `supplier`: "Green Valley" (text)
- `cost`: 15.75 (number)
- `minThreshold`: 5 (number)
- `maxThreshold`: 50 (number)
- `notes`: "Fresh organic carrots" (text)
- `image`: [file upload] (optional)

**Alternative JSON Request (without image):**
```json
{
  "name": "Carrots",
  "quantity": 30,
  "unit": "kg",
  "expiryDate": "2024-02-15",
  "storageCondition": "fridge",
  "category": "vegetables",
  "supplier": "Green Valley",
  "cost": 15.75,
  "minThreshold": 5,
  "maxThreshold": 50,
  "notes": "Fresh organic carrots"
}
```

**Required Fields:**
- `name`: Item name
- `quantity`: Quantity (number)
- `storageCondition`: Storage condition
- `category`: Item category

**Optional Fields:**
- `unit`: Unit of measurement (default: "pcs")
- `expiryDate`: Expiry date (ISO string)
- `supplier`: Supplier name
- `cost`: Cost per unit
- `minThreshold`: Minimum stock threshold
- `maxThreshold`: Maximum stock threshold
- `notes`: Additional notes
- `image`: Image file (jpg, jpeg, png, gif, webp)

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "new_item_id",
    "name": "Carrots",
    "quantity": 30,
    "unit": "kg",
    "addedDate": "2024-01-15T10:30:00.000Z",
    "expiryDate": "2024-02-15T00:00:00.000Z",
    "storageCondition": "fridge",
    "category": "vegetables",
    "supplier": "Green Valley",
    "cost": 15.75,
    "minThreshold": 5,
        "maxThreshold": 50,
        "status": "active",
        "notes": "Fresh organic carrots",
        "image": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/carrots.jpg",
        "addedBy": {
          "_id": "user_id",
          "fullname": "Chef User",
          "email": "chef@gmail.com",
          "role": "chef"
        }
  },
  "message": "Inventory item added successfully",
  "success": true
}
```

### 4. Update Inventory Item
**PUT** `/inventory/:id`

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):** (All fields optional)
- `name`: "Updated Carrots" (text)
- `quantity`: 25 (number)
- `unit`: "kg" (text)
- `expiryDate`: "2024-02-15" (text)
- `storageCondition`: "fridge" (text)
- `category`: "vegetables" (text)
- `supplier`: "Green Valley" (text)
- `cost`: 15.75 (number)
- `minThreshold`: 5 (number)
- `maxThreshold`: 50 (number)
- `notes`: "Updated notes" (text)
- `image`: [file upload] (optional)

**Alternative JSON Request (without image):**
```json
{
  "quantity": 25,
  "cost": 18.00,
  "notes": "Updated - premium organic carrots"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "item_id",
    "name": "Updated Carrots",
    "quantity": 25,
    "unit": "kg",
    "addedDate": "2024-01-15T10:30:00.000Z",
    "expiryDate": "2024-02-15T00:00:00.000Z",
    "storageCondition": "fridge",
    "category": "vegetables",
    "supplier": "Green Valley",
    "cost": 15.75,
    "minThreshold": 5,
    "maxThreshold": 50,
    "status": "active",
    "notes": "Updated notes",
    "addedBy": {
      "_id": "user_id",
      "fullname": "Chef User",
      "email": "chef@gmail.com",
      "role": "chef"
    },
    "lastUpdatedBy": {
      "_id": "user_id",
      "fullname": "Admin User",
      "email": "admin@gmail.com",
      "role": "admin"
    }
  },
  "message": "Inventory item updated successfully",
  "success": true
}
```

### 5. Delete Inventory Item
**DELETE** `/inventory/:id`

**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Inventory item deleted successfully",
  "success": true
}
```

### 6. Get Low Stock Items
**GET** `/inventory/low-stock`

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "item_id",
      "name": "Milk",
      "quantity": 2,
      "unit": "ltr",
      "minThreshold": 5,
      "status": "low_stock"
    }
  ],
  "message": "Low stock items retrieved successfully",
  "success": true
}
```

### 7. Get Expired Items
**GET** `/inventory/expired`

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "item_id",
      "name": "Expired Item",
      "quantity": 10,
      "unit": "pcs",
      "expiryDate": "2024-01-10T00:00:00.000Z",
      "status": "expired"
    }
  ],
  "message": "Expired items retrieved successfully",
  "success": true
}
```

### 8. Get Items by Category
**GET** `/inventory/category/:category`

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "item_id",
      "name": "Tomatoes",
      "quantity": 50,
      "unit": "kg",
      "category": "vegetables"
    }
  ],
  "message": "Items in vegetables category retrieved successfully",
  "success": true
}
```

### 9. Get Inventory Statistics
**GET** `/inventory/stats`

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "totalItems": 150,
    "lowStockCount": 12,
    "expiredCount": 3,
    "outOfStockCount": 5,
    "categoryStats": [
      {
        "_id": "vegetables",
        "count": 45,
        "totalQuantity": 500
      }
    ],
    "storageStats": [
      {
        "_id": "fridge",
        "count": 60,
        "totalQuantity": 300
      }
    ]
  },
  "message": "Inventory statistics retrieved successfully",
  "success": true
}
```

## Data Models

### Inventory Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Item name |
| quantity | Number | Yes | Current quantity |
| unit | String | Yes | Unit of measurement (pcs, kg, ltr, g, ml, lb, oz) |
| addedDate | Date | Auto | Date when item was added |
| expiryDate | Date | No | Expiry date |
| storageCondition | String | Yes | Storage condition (fridge, freezer, normal_temperature, room_temperature, pantry, dry_storage) |
| category | String | Yes | Item category (vegetables, fruits, dairy, meat, seafood, grains, spices, beverages, frozen, canned, other) |
| supplier | String | No | Supplier name |
| cost | Number | No | Cost per unit |
| minThreshold | Number | No | Minimum stock threshold |
| maxThreshold | Number | No | Maximum stock threshold |
| status | String | Auto | Item status (active, low_stock, out_of_stock, expired, discontinued) |
| notes | String | No | Additional notes |
| image | String | No | Cloudinary URL of the item image |
| addedBy | ObjectId | Auto | User who added the item |
| lastUpdatedBy | ObjectId | Auto | User who last updated the item |

### Storage Conditions
- `fridge`: Refrigerated storage
- `freezer`: Frozen storage
- `normal_temperature`: Room temperature
- `room_temperature`: Room temperature
- `pantry`: Pantry storage
- `dry_storage`: Dry storage area

### Categories
- `vegetables`: Fresh vegetables
- `fruits`: Fresh fruits
- `dairy`: Dairy products
- `meat`: Meat products
- `seafood`: Seafood products
- `grains`: Grains and cereals
- `spices`: Spices and seasonings
- `beverages`: Drinks and beverages
- `frozen`: Frozen products
- `canned`: Canned products
- `other`: Other items

### Units
- `pcs`: Pieces
- `kg`: Kilograms
- `ltr`: Liters
- `g`: Grams
- `ml`: Milliliters
- `lb`: Pounds
- `oz`: Ounces

## Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false
}
```

## Authentication Requirements

- All inventory endpoints require authentication with admin@gmail.com or chef@gmail.com
- Only users with these specific email addresses can access inventory features
- The system automatically assigns roles based on email addresses

## Getting Started

1. Start the backend server
2. Create default users: `POST /api/v1/user/create-default-users`
3. Login with admin or chef credentials
4. Start managing inventory items

## Example Usage

```bash
# Create default users
curl -X POST http://localhost:3000/api/v1/user/create-default-users

# Login as admin
curl -X POST http://localhost:3000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gmail.com", "password": "admin123"}'

# Add new inventory item (without image)
curl -X POST http://localhost:3000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh Tomatoes",
    "quantity": 25,
    "unit": "kg",
    "storageCondition": "fridge",
    "category": "vegetables",
    "supplier": "Local Farm",
    "cost": 20.00,
    "minThreshold": 5
  }'

# Add new inventory item (with image)
curl -X POST http://localhost:3000/api/v1/inventory \
  -F "name=Fresh Carrots" \
  -F "quantity=30" \
  -F "unit=kg" \
  -F "storageCondition=fridge" \
  -F "category=vegetables" \
  -F "supplier=Local Farm" \
  -F "cost=15.75" \
  -F "minThreshold=5" \
  -F "image=@/path/to/carrots.jpg"

# Get all inventory items
curl -X GET http://localhost:3000/api/v1/inventory

# Get low stock items
curl -X GET http://localhost:3000/api/v1/inventory/low-stock
```

## Postman Testing with Images

### Testing Image Upload in Postman

1. **Set up the request:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/v1/inventory`
   - Headers: Remove `Content-Type` (let Postman set it automatically for form-data)

2. **Configure Body:**
   - Select `form-data` tab
   - Add fields:
     - `name`: Fresh Tomatoes (Text)
     - `quantity`: 25 (Text)
     - `unit`: kg (Text)
     - `storageCondition`: fridge (Text)
     - `category`: vegetables (Text)
     - `supplier`: Local Farm (Text)
     - `cost`: 20.00 (Text)
     - `minThreshold`: 5 (Text)
     - `image`: [Select File] - Choose an image file (jpg, png, etc.)

3. **Send the request** and check the response for the `image` field containing the Cloudinary URL.

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Image Upload Tips
- Maximum file size: 10MB (configurable in multer middleware)
- Images are automatically uploaded to Cloudinary
- The image URL is returned in the response
- Images are optional - you can add items without images
