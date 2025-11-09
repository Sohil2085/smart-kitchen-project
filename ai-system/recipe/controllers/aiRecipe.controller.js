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

    const csvData = await readIngredientsCSV();
    const ingredient = csvData.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );

    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found in CSV" });
    }

    const expiryDate = calculateExpiry(purchaseDate, ingredient.defaultShelfLifeDays);
    const daysLeft = daysToExpiry(expiryDate);

    const prompt = `You are a professional hotel chef AI working for an Indian restaurant.
Using the ingredient "${ingredient.name}" (category: ${ingredient.category}, storage: ${ingredient.storageCondition}, expires in ${daysLeft} days), suggest 3 creative dishes to use it before expiry.

CUISINE PREFERENCE: Prioritize Indian cuisine dishes with Indian spices, flavors, and cooking techniques. Try to create dishes with an Indian touch (like curries, sabzis, dals, biryanis, tikkas, etc.). However, if the ingredient doesn't work well with Indian cuisine or if an international/other country dish would be significantly better, you may suggest those dishes instead. The goal is to provide the best possible recipes while preferring Indian cuisine when appropriate.

IMPORTANT: Return ONLY valid JSON array. Do NOT include markdown code blocks, backticks, or any other formatting. Return pure JSON only.

Return JSON in this exact format:
[
  {
    "name": "Clean Dish Name",
    "description": "Clear and concise description of the dish",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "instructions": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction"],
    "time": "XX minutes"
  },
  {
    "name": "Clean Dish Name",
    "description": "Clear and concise description of the dish",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "instructions": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction"],
    "time": "XX minutes"
  },
  {
    "name": "Clean Dish Name",
    "description": "Clear and concise description of the dish",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "instructions": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction"],
    "time": "XX minutes"
  }
]

Remember: Return ONLY the JSON array, nothing else. No markdown, no code blocks, no explanations.`;

    // Generate using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    // Extract text response
    let text = result.response.text();

    // Clean markdown code blocks if present
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }
    text = text.trim();

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
