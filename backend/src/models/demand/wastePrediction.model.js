import mongoose from "mongoose";

const wastePredictionSchema = new mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    predictedWasteQuantity: {
      type: Number,
      required: true,
    },
    predictionDate: {
      type: Date,
      default: Date.now,
    },
    predictionModel: {
      type: String,
      enum: ["Regression", "TimeSeries", "LSTM", "Prophet", "Custom", "Expired"],
      default: "Regression",
    },
    confidenceScore: {
      type: Number, // Percentage (0 to 1)
      min: 0,
      max: 1,
    },
    additionalNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

export const WastePrediction = mongoose.model("WastePrediction",wastePredictionSchema);
