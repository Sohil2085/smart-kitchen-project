import { readIngredientsCSV } from "../utils/csvReader.js";
import { genAI } from "../utils/geminiClient.js";

function calculateExpiry(purchaseDate, shelfLifeDays) {
  const expiry = new Date(purchaseDate);
  expiry.setDate(expiry.getDate() + Number(shelfLifeDays));
  return expiry;
}

function daysToExpiry(expiryDate) {
  return Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
}

export async function getPredictedExpiryAndRecipes(req, res) {
  console.log("=== Recipe Generation Request ===");
  console.log("Request body:", req.body);
  
  try {
    const { name, purchaseDate } = req.body;

    if (!name || !purchaseDate) {
      console.log("Missing required fields - name:", name, "purchaseDate:", purchaseDate);
      return res.status(400).json({
        message: "Please provide 'name' and 'purchaseDate' in the request body."
      });
    }

    console.log(`Looking for ingredient: "${name}" with purchaseDate: ${purchaseDate}`);

    // Read CSV and find ingredient
    let csvData;
    try {
      console.log("Reading CSV file...");
      csvData = await readIngredientsCSV();
      console.log(`CSV loaded successfully. Found ${csvData.length} ingredients.`);
    } catch (csvError) {
      console.error("Error reading CSV:", csvError);
      console.error("CSV Error stack:", csvError.stack);
      return res.status(500).json({ 
        message: "Failed to read ingredients CSV file", 
        error: csvError.message 
      });
    }

    const ingredient = csvData.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );

    if (!ingredient) {
      console.log(`Ingredient "${name}" not found. Available ingredients:`, csvData.map(i => i.name).slice(0, 10));
      return res.status(404).json({ 
        message: `Ingredient "${name}" not found in CSV. Available ingredients: ${csvData.map(i => i.name).slice(0, 10).join(", ")}...` 
      });
    }

    console.log(`Found ingredient:`, {
      name: ingredient.name,
      category: ingredient.category,
      defaultShelfLifeDays: ingredient.defaultShelfLifeDays,
      storageCondition: ingredient.storageCondition
    });

    // Validate purchaseDate
    const purchaseDateObj = new Date(purchaseDate);
    if (isNaN(purchaseDateObj.getTime())) {
      console.log(`Invalid purchaseDate: ${purchaseDate}`);
      return res.status(400).json({ 
        message: `Invalid purchaseDate format: ${purchaseDate}. Please use YYYY-MM-DD format.` 
      });
    }

    // Calculate expiry info
    const expiryDate = calculateExpiry(purchaseDate, ingredient.defaultShelfLifeDays);
    const daysLeft = daysToExpiry(expiryDate);
    
    console.log(`Expiry calculation:`, {
      purchaseDate,
      shelfLifeDays: ingredient.defaultShelfLifeDays,
      expiryDate: expiryDate.toISOString(),
      daysLeft
    });

    // Prompt
    const prompt = `You are a professional hotel chef AI working for an Indian restaurant.
Using the nearly expiring ingredient "${ingredient.name}" (category: ${ingredient.category}, storage: ${ingredient.storageCondition}, expires in ${daysLeft} days),
create 3 smart Indian-style dishes to use it before expiry to reduce waste.

CUISINE PREFERENCE: Prefer Indian cuisine (curries, tikkas, sabzis, dals, biryanis) unless an international recipe suits the ingredient better.
Focus on minimizing food waste and smart reuse.

IMPORTANT: Return ONLY valid JSON array. Do NOT include markdown, backticks, or extra text.
Return JSON in this format:
[
  {
    "name": "Dish Name",
    "description": "Short dish description",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "time": "XX minutes"
  }
]`;

    // =============================
    //  🔥 GEMINI — UPDATED SECTION
    // =============================

    console.log("Calling Gemini API...");
    let model, result;

    // Try multiple model names - some may work with different API versions
    const modelNames = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-flash-latest",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-pro"
    ];
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        console.log(`Attempting to use ${modelName} model...`);

        // Get model with explicit API version if needed
        model = genAI.getGenerativeModel({ model: modelName });

        console.log(`Model ${modelName} initialized successfully`);
        
        console.log("Generating content with Gemini...");
        result = await model.generateContent(prompt);

        console.log(`Gemini API call successful with ${modelName}`);
        break;

      } catch (modelError) {
        console.warn(`${modelName} failed:`, modelError.message);
        lastError = modelError;
        // Continue to next model
      }
    }

    // If all models failed
    if (!result) {
      console.error("All Gemini models failed. Last error:", lastError);
      const errorMessage = lastError?.message || "Unknown error";

      if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
        return res.status(500).json({ 
          message: "Invalid or missing GEMINI_API_KEY", 
          error: errorMessage
        });
      }

      if (errorMessage.includes("model") || errorMessage.includes("available models")) {
        return res.status(500).json({ 
          message: "Gemini model not available", 
          error: errorMessage
        });
      }

      return res.status(500).json({ 
        message: "Failed to generate recipes with Gemini API", 
        error: errorMessage
      });
    }

    // Extract text
    let text;
    try {
      text = result.response.text().trim();
    } catch (textError) {
      return res.status(500).json({ 
        message: "Failed to extract text from Gemini response", 
        error: textError.message 
      });
    }

    if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    else if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");

    let recipes;
    try {
      recipes = JSON.parse(text);
      if (!Array.isArray(recipes)) recipes = [recipes];
    } catch (parseError) {
      return res.status(500).json({
        message: "Failed to parse Gemini response as JSON",
        error: parseError.message,
        rawResponse: text.substring(0, 500)
      });
    }

    console.log("Sending response with", recipes.length, "recipes");

    res.json({
      ingredient: ingredient.name,
      expiryDate: expiryDate.toISOString().split('T')[0],
      daysLeft,
      recipes
    });

  } catch (error) {
    console.error("Unexpected error in recipe generation:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
}
