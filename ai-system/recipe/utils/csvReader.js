import fs from "fs";
import csv from "csv-parser";

export function readIngredientsCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream("ingredients_master.csv")
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}
