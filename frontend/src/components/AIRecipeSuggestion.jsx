import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { InventoryAPI } from "../utils/api.js";
import { getDaysUntilExpiry, getExpiryStatusClass } from "../utils/expiryUtils.js";

const AIRecipeSuggestion = () => {
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingIngredients, setFetchingIngredients] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [showRecipes, setShowRecipes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch near-expiry items on component mount
  useEffect(() => {
    fetchNearExpiryItems();
  }, []);

  const fetchNearExpiryItems = async () => {
    try {
      setFetchingIngredients(true);
      const response = await InventoryAPI.getNearExpiryItems(3);
      const items = response.data || [];
      setAvailableIngredients(items);
      
      if (items.length === 0) {
        toast.info("No items are expiring within the next 3 days.");
      }
    } catch (error) {
      console.error("Error fetching near-expiry items:", error);
      toast.error("Failed to fetch near-expiry items: " + error.message);
    } finally {
      setFetchingIngredients(false);
    }
  };

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) => {
      const isSelected = prev.some((ing) => ing._id === ingredient._id);
      if (isSelected) {
        return prev.filter((ing) => ing._id !== ingredient._id);
      } else {
        return [...prev, ingredient];
      }
    });
  };

  const generateRecipes = async () => {
    if (selectedIngredients.length === 0) {
      toast.error("Please select at least one ingredient from your inventory");
      return;
    }

    try {
      setLoading(true);
      setRecipes([]);
      
      // Generate recipes for each selected ingredient
      const allRecipes = [];
      const skippedIngredients = [];
      
      for (const ingredient of selectedIngredients) {
        try {
          // Calculate purchaseDate from addedDate or use current date
          // The AI controller expects purchaseDate to calculate expiry
          let purchaseDate;
          if (ingredient.addedDate) {
            purchaseDate = new Date(ingredient.addedDate).toISOString().split('T')[0];
          } else if (ingredient.expiryDate) {
            // If we have expiryDate but no addedDate, estimate purchaseDate (7 days before expiry as default)
            const expiry = new Date(ingredient.expiryDate);
            const estimatedPurchase = new Date(expiry);
            estimatedPurchase.setDate(estimatedPurchase.getDate() - 7);
            purchaseDate = estimatedPurchase.toISOString().split('T')[0];
          } else {
            // Use current date as fallback
            purchaseDate = new Date().toISOString().split('T')[0];
          }
          
          const res = await axios.post("http://localhost:5000/api/ai/predict", {
            name: ingredient.name,
            purchaseDate: purchaseDate
          });
          
          // Handle the response structure: { ingredient, expiryDate, daysLeft, recipes }
          if (res.data) {
            // Check if recipes were generated (controller returns recipes array)
            if (res.data.recipes && Array.isArray(res.data.recipes) && res.data.recipes.length > 0) {
              // Add ingredient info to each recipe for context
              const recipesWithInfo = res.data.recipes.map(recipe => ({
                ...recipe,
                sourceIngredient: res.data.ingredient,
                daysLeft: res.data.daysLeft,
                expiryDate: res.data.expiryDate
              }));
              allRecipes.push(...recipesWithInfo);
            } else if (Array.isArray(res.data)) {
              // Fallback: if response is directly an array
              allRecipes.push(...res.data);
            }
          }
        } catch (error) {
          console.error(`Error generating recipe for ${ingredient.name}:`, error);
          const errorMessage = error.response?.data?.message || error.message || "Unknown error";
          toast.error(`Failed to generate recipe for ${ingredient.name}: ${errorMessage}`);
        }
      }
      
      if (allRecipes.length === 0) {
        toast.error("No recipes were generated. Please try again.");
        return;
      }
      
      setRecipes(allRecipes);
      setShowRecipes(true);
      toast.success(`Generated ${allRecipes.length} recipe suggestions!`);
    } catch (error) {
      toast.error("Failed to generate AI recipes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = availableIngredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If recipes are shown, display them
  if (showRecipes) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI-Based Recipe Suggestions</h2>
          <button
            onClick={() => {
              setShowRecipes(false);
              setRecipes([]);
              setSelectedIngredients([]);
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Select Different Ingredients
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500">Generating AI suggestions...</p>
        ) : recipes.length === 0 ? (
          <p className="text-gray-500">No suggestions yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((r, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{r.name}</h3>
                  {r.sourceIngredient && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Using: {r.sourceIngredient}
                    </span>
                  )}
                </div>
                {r.daysLeft !== undefined && (
                  <p className="text-xs text-red-600 mb-2">
                    ⚠️ Expires in {r.daysLeft} day(s)
                  </p>
                )}
                <p className="text-gray-600 mb-2">{r.description}</p>
                {r.ingredients && Array.isArray(r.ingredients) && (
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">Ingredients:</span> {r.ingredients.join(", ")}
                  </p>
                )}
                {r.instructions && Array.isArray(r.instructions) && (
                  <div className="text-sm text-gray-600 mb-2">
                    <p className="font-medium mb-1">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {r.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {r.time && (
                  <p className="text-sm text-blue-600 mb-2">
                    <span className="font-medium">Time:</span> {r.time}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show ingredient selection page
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Select Ingredients from Inventory</h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-yellow-800">
          <span className="font-medium">Note:</span> Only items expiring within the next 3 days are shown below. 
          Select one or more ingredients to generate AI recipe suggestions and reduce food waste.
        </p>
      </div>
      
      <p className="text-gray-600 mb-4">
        Select one or more ingredients from the list below to generate AI recipe suggestions.
      </p>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={fetchingIngredients}
        />
      </div>

      {/* Selected ingredients count */}
      {selectedIngredients.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800">
            {selectedIngredients.length} ingredient(s) selected
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedIngredients.map((ing) => (
              <span
                key={ing._id}
                className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm"
              >
                {ing.name}
                <button
                  onClick={() => toggleIngredient(ing)}
                  className="ml-2 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients list */}
      {fetchingIngredients ? (
        <div className="text-center py-8 mb-4">
          <p className="text-gray-500">Loading near-expiry items...</p>
        </div>
      ) : (
        <div className="mb-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
          {filteredIngredients.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No items expiring within the next 3 days.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredIngredients.map((ingredient) => {
                const isSelected = selectedIngredients.some(
                  (ing) => ing._id === ingredient._id
                );
                const daysLeft = getDaysUntilExpiry(ingredient.expiryDate);
                const expiryClass = getExpiryStatusClass(ingredient.expiryDate);
                
                return (
                  <div
                    key={ingredient._id}
                    onClick={() => toggleIngredient(ingredient)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{ingredient.name}</h3>
                        <p className="text-sm text-gray-600">
                          Stock: {ingredient.currentStock} {ingredient.unit || "pcs"}
                        </p>
                        {ingredient.category && (
                          <p className="text-xs text-gray-500">
                            {ingredient.category}
                          </p>
                        )}
                        {ingredient.expiryDate && (
                          <p className={`text-xs mt-1 ${expiryClass}`}>
                            {daysLeft !== null && daysLeft >= 0
                              ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                              : 'Expired'}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-blue-500 font-bold ml-2">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Generate button */}
      <div className="flex justify-end">
        <button
          onClick={generateRecipes}
          disabled={loading || selectedIngredients.length === 0 || fetchingIngredients}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating Recipes..." : "Generate AI Recipe Suggestions"}
        </button>
      </div>
    </div>
  );
};

export default AIRecipeSuggestion;
