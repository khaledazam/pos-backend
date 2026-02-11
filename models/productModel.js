const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "اسم المنتج مطلوب"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "الفئة مطلوبة"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "السعر مطلوب"],
      min: [0, "السعر لا يمكن أن يكون سالبًا"],
    },
    quantity: {
      type: Number,
      required: [true, "الكمية مطلوبة"],
      min: [0, "الكمية لا يمكن أن تكون سالبة"],
      default: 0,
    },
    unit: {
      type: String,
      default: "قطعة",
      enum: ["قطعة", "كيلو", "علبة", "كرتونة", "لتر", "جم", "متر"],
    },
    warning: {
      type: Boolean,
      default: false,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

// تلقائي: لو الكمية أقل من الحد الأدنى → warning = true
productSchema.pre("save", function (next) {
  if (this.quantity <= this.lowStockThreshold) {
    this.warning = true;
  } else {
    this.warning = false;
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);