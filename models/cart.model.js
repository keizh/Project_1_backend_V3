const mongoose = require(`mongoose`);
const { Schema } = mongoose;

const cartProductSchema = mongoose.Schema(
  {
    productCartId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    productQuantity: {
      type: Number,
      min: 1,
      required: true,
    },
    productColor: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    productSize: {
      type: String,
      required: true,
    },
    productImg: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const cartSchema = mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    products: [cartProductSchema],
  },
  { timestamps: true }
);

const cartModel = mongoose.model("cart", cartSchema);

module.exports = { cartModel };
