import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct absolute path to CSV file
const csvPath = path.join(__dirname, "..", "ingredients_master.csv");

export function readIngredientsCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    
    console.log(`Attempting to read CSV from: ${csvPath}`);
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file does not exist at: ${csvPath}`);
      console.error(`Current working directory: ${process.cwd()}`);
      return reject(new Error(`CSV file not found at: ${csvPath}`));
    }
    
    console.log(`CSV file found. Reading...`);
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        console.log(`CSV read complete. Loaded ${results.length} rows.`);
        resolve(results);
      })
      .on("error", (err) => {
        console.error("Error reading CSV file:", err);
        console.error("Error details:", err.message, err.stack);
        reject(new Error(`Failed to read CSV file: ${err.message}`));
      });
  });
}
