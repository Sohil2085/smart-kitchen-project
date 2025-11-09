import mongoose from "mongoose";

const salesSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    quantitySold: {
      type: Number,
      required: true,
    },
    saleDate: {
      type: Date,
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    season: {
      type: String,
      enum: ["Spring", "Summer", "Monsoon", "Autumn", "Winter"],
    },
    specialEvent: {
      type: String, 
      enum : ["Reguler","Festival","Holiday","Promotion"],
      default: "Reguler",
    },
  },
  { timestamps: true }
);

export const Sales = mongoose.model("Sales", salesSchema);
