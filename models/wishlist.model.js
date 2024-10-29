const mongoose = require(`mongoose`);
const { Schema } = require(`mongoose`);

const productSchema = mongoose.Schema({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "products",
  },
  productImg: {
    type: String,
    required: true,
  },
  productPrice: {
    type: Number,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
});

const wishlistSchema = mongoose.Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "users",
  },
  products: [productSchema],
});

const wishlistModel = mongoose.model("wishlist", wishlistSchema);

module.exports = { wishlistModel };
