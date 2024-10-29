const mongoose = require(`mongoose`);

const OrdersProductArraySchema = mongoose.Schema(
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

const OrdersArraySchema = mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
    },
    products: [OrdersProductArraySchema],
    total: {
      required: true,
      type: Number,
    },
  },
  { timestamps: true }
);

const OrderSchema = mongoose.Schema(
  {
    userId: {
      required: true,
      ref: "users",
      type: mongoose.Schema.Types.ObjectId,
    },
    Orders: [OrdersArraySchema],
  },
  { timestamps: true }
);

const ordersModel = mongoose.model("orders", OrderSchema);

module.exports = { ordersModel };
