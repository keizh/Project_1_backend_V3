const mongoose = require(`mongoose`);

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    description: String,
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    category: String,
    subCategory: String,
    for: {
      type: String,
      enum: ["Men", "Women", "Kids", "Unisex"],
      required: true,
    },
    sizesAvailable: [String],
    colorOptions: [String],
    material: String,
    brand: {
      type: String,
      default: "Amazon Basic's",
    },
    stock: {
      type: Number,
      default: 1,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 1,
    },
    reviews: {
      type: Number,
      default: 3,
    },
    imageURL: {
      type: Map,
      of: String,
    },
    in_wishlist: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const productModel = mongoose.model("products", productSchema);

module.exports = { productModel };
