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
  try {
    const { name, purchaseDate } = req.body;

    if (!name || !purchaseDate) {
      return res.status(400).json({
        message: "Please provide 'name' and 'purchaseDate' in the request body."
      });
    }

    // Read CSV and find ingredient
    const csvData = await readIngredientsCSV();
    const ingredient = csvData.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );

    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found in CSV" });
    }

    // Calculate expiry info
    const expiryDate = calculateExpiry(purchaseDate, ingredient.defaultShelfLifeDays);
    const daysLeft = daysToExpiry(expiryDate);

    // ✅ Generate AI recipes (expiry check is done at the inventory list level, not here)
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
  },
  ...
]`;

    // Generate using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    // Extract and clean text
    let text = result.response.text().trim();
    if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    else if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");

    let recipes;
    try {
      recipes = JSON.parse(text);
    } catch (parseError) {
      recipes = [{ note: "Gemini returned non-JSON response", raw: text }];
    }

    res.json({
      ingredient: ingredient.name,
      expiryDate,
      daysLeft,
      recipes
    });

  } catch (error) {
    console.error("Error in Gemini recipe generation:", error);
    res.status(500).json({ message: "Gemini API error", error: error.message });
  }
}
