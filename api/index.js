const bcrypt = require(`bcrypt`);
const JWT = require(`jsonwebtoken`);
const dotenv = require("dotenv");
dotenv.config();
var uniqid = require("uniqid");
const { db_establish_connection } = require(`../DB/db_establish_connection.js`);
// db_establish_connection()
const { userModel } = require(`../models/user.model.js`);
const { productModel } = require(`../models/product.model.js`);
const { cartModel } = require(`../models/cart.model.js`);
const { wishlistModel } = require(`../models/wishlist.model.js`);
const { ordersModel } = require("../models/order.model.js");
// const { auth } = require(`./auth.js`);
const express = require(`express`);
const app = express();
const cors = require(`cors`);
const corsOption = {
  origin: true,
  // origin: [
  //   "http://localhost:5173",
  //   "https://project-1-frontend-six.vercel.app",
  //   "*",
  // ],
  allowedMethods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};
db_establish_connection();
app.use(cors(corsOption));
app.use(express.json());

const auth = (req, res, next) => {
  const { authorization } = req.headers;
  console.log("auth", req.headers);
  if (!authorization) {
    return res.status(403).json({ message: "Token is required" });
  }
  try {
    const decoded = JWT.verify(authorization, process.env.JWT_SECRET);
    req.headers.id = decoded.id;
    req.headers.name = decoded.name;
    next();
  } catch (err) {
    return res.status(401).json({ message: "UN-Authorized Access" });
  }

  // JWT.verify(authorization, process.env.JWT_SECRET, (err, result) => {
  //   console.log(result);
  //   if (err) {
  //     res.status(404).json({ message: "UN-Authorized Access" });
  //   } else {
  //     req.headers.id = result.id;
  //     req.headers.name = result.name;
  //     console.log(req.headers);
  //     next();
  //   }
  // });
};

app.get("/", (req, res) => {
  res.status(200).json({ message: "deployment is working" });
});

app.get("/auth", auth, (req, res) => {
  res.status(200).json({ message: "web-server is working" });
});

// --> frontend DONE
// sign-up page
app.post("/sign-up", async (req, res) => {
  const { name, email, password, address } = req.body;
  console.log(name, email, password, address);
  console.log("fonrtend");
  try {
    // hashing password
    const hashedPassword = await bcrypt.hash(password, 5);
    // creating newUser using userModel
    const newUser = userModel({
      name,
      email,
      password: hashedPassword,
      address,
    });
    // saving newUser in Database
    const dataSaved = await newUser.save();
    // creating a new cart for the user
    const newUserCart = cartModel({ user_id: dataSaved._id, products: [] });
    const cartSaved = await newUserCart.save();
    // creating a new wishlist for the user
    const newUserWishlist = wishlistModel({
      user_id: dataSaved._id,
      products: [],
    });
    const wishlistSaved = await newUserWishlist.save();
    // new orders
    const ordersForThisUser = await new ordersModel({
      userId: dataSaved._id,
      Orders: [],
    }).save();
    if (dataSaved) {
      res.status(201).json({
        status: "success",
        message: "New account has been created, Please Login",
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "Input Data Should be Unique",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${email} is already has an account`,
    });
  }
});

// --> frontend DONE
// sign-in page
app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(400).json({
        status: "Incorrect Email",
        message: "No Account with this email. Sign-up",
      });
    } else {
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        const JWT_token = JWT.sign(
          { id: user._id, name: user.name },
          process.env.JWT_SECRET,
          { expiresIn: "3h" }
        );
        res.status(200).json({
          status: "success",
          message: `Welcome ${user.name}`,
          token: JWT_token,
        });
      } else {
        res
          .status(400)
          .json({ status: "failed", message: "Incorrect password" });
      }
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: `${error.message}` });
  }
});

// --> frontend DONE
app
  .post("/product", auth, async (req, res) => {
    const body = req.body;
    const newProduct = new productModel(body);
    try {
      const newProductAdded = await newProduct.save();
      if (newProductAdded) {
        res.status(201).json({
          status: "success",
          message: "product was successfully created",
          newProductAdded,
        });
      } else {
        res.status(400).json({ status: "error", message: "Failed to add" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: `${error.message}` });
    }
  })
  .get("/product", auth, async (req, res) => {
    try {
      const products = await productModel.find();
      if (products) {
        res.status(200).json({
          status: "success",
          message: "product data was successfully fetched",
          data: {
            products,
          },
        });
      } else {
        res.status(404).json({
          status: "failed",
          message: "Failed to Fetch Data",
        });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: `${error.message}` });
    }
  });

app.route(`/product/:id`).get(auth, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productModel.findById(id);
    if (product) {
      res.status(200).json({
        status: "success",
        message: "Product has been fetch successfully",
        data: {
          product,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch data from database",
    });
  }
});

app.route(`/productByCategory/:name`).get(auth, async (req, res) => {
  const { name } = req.params;
  try {
    let data;
    if (name == "All") {
      data = await productModel.find();
    } else {
      data = await productModel.find({ for: name });
    }
    if (data && data.length > 0) {
      res.status(200).json({
        status: "success",
        data: {
          products: data,
        },
      });
    } else {
      res
        .status(404)
        .json({ status: "failed", message: "No such data Exists" });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: `${error.message}` });
  }
});

// get  : view of cart --> frontend DONE
// post : add a new item in cart --> frontend DONE
// delete : delete item from cart --> frontend DONE
app
  .route(`/cart`)
  .get(auth, async (req, res) => {
    const { user_id } = req.headers;
    try {
      const data = await cartModel.find({ user_id });
      if (data) {
        res
          .status(200)
          .json({ status: "success", message: "Cart fetched", data });
      } else {
        res
          .status(404)
          .json({ status: "Failed", message: "No Such Cart Exists" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: `${error.message}` });
    }
  })
  .post(auth, async (req, res) => {
    const { user_id } = req.headers;
    const {
      // when ever you are adding a clothe make sure to add productId+color+size
      productId,
      productCartId,
      productImg,
      productQuantity,
      productColor,
      productPrice,
      productSize,
      productName,
    } = req.body;

    try {
      const cartData = await cartModel.findOne({ user_id });
      const index = cartData.products.findIndex(
        (ele) => ele.productCartId == productCartId
      );
      if (index == -1) {
        // when products does not exist , create new proudct
        const products = [
          ...cartData.products,
          {
            productId,
            productCartId,
            productImg,
            productQuantity,
            productColor,
            productPrice,
            productSize,
            productName,
          },
        ];
        const newCart = await cartModel.findOneAndUpdate(
          { user_id },
          {
            products,
          },
          { new: true }
        );
        res
          .status(200)
          .json({ message: "add to cart", success: "add", newCart });
      } else {
        // let products = cartData.products;
        // Object.assign(products[index], {
        //   productId,
        //   productCartId,
        //   productImg,
        //   productColor,
        //   productPrice,
        //   productSize,
        //   productQuantity: products[index].productQuantity + 1,
        // });
        // const newCart = await cartModel.findOneAndUpdate(
        //   { user_id },
        //   {
        //     products,
        //   },
        //   { new: true }
        // );
        res.status(200).json({ message: "Product is in cart", success: "add" });
      }
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: `${error.message}`,
      });
    }
  });

app.route(`/cart/:id`).delete(auth, async (req, res) => {
  const { user_id } = req.headers;
  const { id: productCartId } = req.params;
  console.log(`request made to delete `, productCartId);
  try {
    // console.log(user_id);
    const cartOfUser = await cartModel.findOne({ user_id });
    // console.log(cartOfUser);
    const products = cartOfUser.products.filter(
      (ele) => ele.productCartId != productCartId
    );
    const dataAfterDeleted = await cartModel.findOneAndUpdate(
      { user_id },
      { products },
      {
        new: true,
      }
    );
    res.status(200).json({
      status: "success",
      message: "data was deleted",
      dataAfterDeleted,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: `${error.message}` });
  }
});

//   wishlist --> frontend DONE
app.route(`/wishlist`).get(auth, async (req, res) => {
  const { user_id } = req.headers;
  try {
    const wishlistData = await wishlistModel.findOne({ user_id });
    if (wishlistData) {
      res.status(200).json({
        status: "success",
        message: "wishList fetched",
        data: {
          wishlistData,
        },
      });
    } else {
      res
        .status(404)
        .json({ status: "failed", message: "No Such Wishlist exists" });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: `${error.message}` });
  }
});
// add to wishlist from products --> frontend DONE
app.route(`/wishlist/add`).post(auth, async (req, res) => {
  const { user_id } = req.headers;
  const { productId, productImg, productPrice, productName } = req.body;
  try {
    // toggle true to make changes to the product in products
    const newUpdateProduct = await productModel.findOneAndUpdate(
      { _id: productId },
      { in_wishlist: true },
      { new: true }
    );
    // fetching wishlist for wishlist products array
    const wishlist = await wishlistModel.findOne({ user_id });
    var products = [
      ...wishlist.products,
      { productId, productImg, productPrice, productName },
    ];
    // updating products array
    const newUpdatedWishList = await wishlistModel.findOneAndUpdate(
      { user_id },
      { products },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      message: "Added to wishlist",
      newUpdatedWishList,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: `${error.message}` });
  }
});
// remove from wishlist --> frontend DONE
app.route(`/wishlist/remove`).post(auth, async (req, res) => {
  const { user_id } = req.headers;
  const { productId } = req.body;
  try {
    const updatedProduct = await productModel.findOneAndUpdate(
      { _id: productId },
      { in_wishlist: false },
      { new: true }
    );
    const wishlist = await wishlistModel.findOne({ user_id });
    var products = wishlist.products;
    products = products.filter((ele) => ele.productId != productId);
    const newUpdatedWishList = await wishlistModel.findOneAndUpdate(
      { user_id },
      { products },
      { new: true }
    );
    res.status(200).json({ status: "success", newUpdatedWishList });
  } catch (error) {
    res.status(500).json({ status: "error", message: `${error.message}` });
  }
});

// increment quantity by 1 --> frontend DONE
app.route(`/cart/addedBy1`).post(auth, async (req, res) => {
  const { user_id } = req.headers;
  const {
    // when ever you are adding a clothe make sure to add productId+color+size
    productCartId,
  } = req.body;

  try {
    const cartData = await cartModel.findOne({ user_id });
    const index = cartData.products.findIndex(
      (ele) => ele.productCartId == productCartId
    );

    let products = cartData.products;
    Object.assign(products[index], {
      ...products[index],
      productQuantity: products[index].productQuantity + 1,
    });
    const newCart = await cartModel.findOneAndUpdate(
      { user_id },
      {
        products,
      },
      { new: true }
    );
    res.status(200).json({ success: "quantity increased + 1", newCart });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
});

// decrement quantity by 2 --> frontend DONE
app.route(`/cart/subtractBy1`).post(auth, async (req, res) => {
  const { user_id } = req.headers;
  const {
    // when ever you are adding a clothe make sure to add productId+color+size
    productCartId,
  } = req.body;

  try {
    const cartData = await cartModel.findOne({ user_id });
    const index = cartData.products.findIndex(
      (ele) => ele.productCartId == productCartId
    );

    let products = cartData.products;
    Object.assign(products[index], {
      ...products[index],
      productQuantity: products[index].productQuantity - 1,
    });
    const newCart = await cartModel.findOneAndUpdate(
      { user_id },
      {
        products,
      },
      { new: true }
    );
    res.status(200).json({ success: "quantity increased + 1", newCart });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
});

app.route(`/cart/clear`).get(auth, async (req, res) => {
  const { user_id } = req.headers;
  try {
    const newCart = await cartModel.findOneAndUpdate(
      { user_id },
      { products: [] },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      message: "cart has been successfully cleared",
      newCart,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: `${err.message}` });
  }
});

app.route(`/checkOut`).get(auth, async (req, res) => {
  const { user_id, name } = req.headers;
  try {
    const { address } = await userModel.findOne({ _id: user_id });
    const { products } = await cartModel.findOne({ user_id });
    if (address) {
      res.status(200).json({
        status: "success",
        message: "user-details fetched",
        user_id,
        name,
        address,
        products,
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "failed to fetch user-details",
      });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: `${error.message}` });
  }
});
app
  .route(`/order`)
  .post(auth, async (req, res) => {
    const user_id = req.headers.user_id;
    const { products, total } = req.body;
    const newOrder = { orderId: uniqid(), total, products };
    try {
      const orderDocumentOfUser = await ordersModel.findOne({
        userId: user_id,
      });
      const dataPushed = await ordersModel.findOneAndUpdate(
        { userId: user_id },
        {
          // Orders: [...orderDocumentOfUser.Orders, newOrder],
          $push: { Orders: newOrder },
        },
        { new: true }
      );
      if (dataPushed) {
        res.status(200).json({ status: "successful", dataPushed });
      }
    } catch (err) {
      res.status(500).json({ status: "failed", message: `${err.message}` });
    }
  })
  .get(auth, async (req, res) => {
    const { user_id } = req.headers;
    try {
      const data = await ordersModel.findOne({ userId: user_id });
      if (data) {
        res.status(200).json({ failed: "success", data });
      } else {
        res.status(400).json({
          status: "failed",
          message: "failed to fetch data from DataBase",
          data,
        });
      }
    } catch (err) {
      res.status(500).json({ status: "error", message: `${err.message}` });
    }
  });

app.listen(process.env.PORT, () => console.log(`Web-server is Online`));
module.exports = app;

// (async function () {
//   try {
//     await db_establish_connection();

//     app.route(`/`).get((req, res) => {
//       res.status(200).json({ message: "deployment is working" });
//     });

//     app.route(`/auth`).get(auth, (req, res) => {
//       res.status(200).json({ message: "web-server is working" });
//     });

//     // --> frontend DONE
//     // sign-up page
//     app.route(`/sign-up`).post(async (req, res) => {
//       const { name, email, password, address } = req.body;
//       console.log(name, email, password, address);
//       console.log("fonrtend");
//       try {
//         // hashing password
//         const hashedPassword = await bcrypt.hash(password, 5);
//         // creating newUser using userModel
//         const newUser = userModel({
//           name,
//           email,
//           password: hashedPassword,
//           address,
//         });
//         // saving newUser in Database
//         const dataSaved = await newUser.save();
//         // creating a new cart for the user
//         const newUserCart = cartModel({ user_id: dataSaved._id, products: [] });
//         const cartSaved = await newUserCart.save();
//         // creating a new wishlist for the user
//         const newUserWishlist = wishlistModel({
//           user_id: dataSaved._id,
//           products: [],
//         });
//         const wishlistSaved = await newUserWishlist.save();
//         // new orders
//         const ordersForThisUser = await new ordersModel({
//           userId: dataSaved._id,
//           Orders: [],
//         }).save();
//         if (dataSaved) {
//           res.status(201).json({
//             status: "success",
//             message: "New account has been created, Please Login",
//           });
//         } else {
//           res.status(400).json({
//             status: "failed",
//             message: "Input Data Should be Unique",
//           });
//         }
//       } catch (error) {
//         res.status(500).json({
//           status: "error",
//           message: `${email} is already has an account`,
//         });
//       }
//     });

//     // --> frontend DONE
//     // sign-in page
//     app.route(`/sign-in`).post(async (req, res) => {
//       const { email, password } = req.body;
//       try {
//         const user = await userModel.findOne({ email });
//         if (!user) {
//           res.status(400).json({
//             status: "Incorrect Email",
//             message: "No Account with this email. Sign-up",
//           });
//         } else {
//           const result = await bcrypt.compare(password, user.password);
//           if (result) {
//             const JWT_token = JWT.sign(
//               { id: user._id, name: user.name },
//               process.env.JWT_SECRET,
//               { expiresIn: "3h" }
//             );
//             res.status(200).json({
//               status: "success",
//               message: `Welcome ${user.name}`,
//               token: JWT_token,
//             });
//           } else {
//             res
//               .status(400)
//               .json({ status: "failed", message: "Incorrect password" });
//           }
//         }
//       } catch (error) {
//         res.status(500).json({ status: "error", message: `${error.message}` });
//       }
//     });

//     // --> frontend DONE
//     app
//       .route(`/product`)
//       .post(auth, async (req, res) => {
//         const body = req.body;
//         const newProduct = new productModel(body);
//         try {
//           const newProductAdded = await newProduct.save();
//           if (newProductAdded) {
//             res.status(201).json({
//               status: "success",
//               message: "product was successfully created",
//               newProductAdded,
//             });
//           } else {
//             res.status(400).json({ status: "error", message: "Failed to add" });
//           }
//         } catch (error) {
//           res
//             .status(500)
//             .json({ status: "error", message: `${error.message}` });
//         }
//       })
//       .get(auth, async (req, res) => {
//         try {
//           const products = await productModel.find();
//           if (products) {
//             res.status(200).json({
//               status: "success",
//               message: "product data was successfully fetched",
//               data: {
//                 products,
//               },
//             });
//           } else {
//             res.status(404).json({
//               status: "failed",
//               message: "Failed to Fetch Data",
//             });
//           }
//         } catch (error) {
//           res
//             .status(500)
//             .json({ status: "error", message: `${error.message}` });
//         }
//       });

//     app.route(`/product/:id`).get(auth, async (req, res) => {
//       const { id } = req.params;
//       try {
//         const product = await productModel.findById(id);
//         if (product) {
//           res.status(200).json({
//             status: "success",
//             message: "Product has been fetch successfully",
//             data: {
//               product,
//             },
//           });
//         }
//       } catch (error) {
//         res.status(500).json({
//           status: "error",
//           message: "Failed to fetch data from database",
//         });
//       }
//     });

//     app.route(`/productByCategory/:name`).get(auth, async (req, res) => {
//       const { name } = req.params;
//       try {
//         let data;
//         if (name == "All") {
//           data = await productModel.find();
//         } else {
//           data = await productModel.find({ for: name });
//         }
//         if (data && data.length > 0) {
//           res.status(200).json({
//             status: "success",
//             data: {
//               products: data,
//             },
//           });
//         } else {
//           res
//             .status(404)
//             .json({ status: "failed", message: "No such data Exists" });
//         }
//       } catch (error) {
//         res.status(500).json({ status: "error", message: `${error.message}` });
//       }
//     });

//     // get  : view of cart --> frontend DONE
//     // post : add a new item in cart --> frontend DONE
//     // delete : delete item from cart --> frontend DONE
//     app
//       .route(`/cart`)
//       .get(auth, async (req, res) => {
//         const { user_id } = req.headers;
//         try {
//           const data = await cartModel.find({ user_id });
//           if (data) {
//             res
//               .status(200)
//               .json({ status: "success", message: "Cart fetched", data });
//           } else {
//             res
//               .status(404)
//               .json({ status: "Failed", message: "No Such Cart Exists" });
//           }
//         } catch (error) {
//           res
//             .status(500)
//             .json({ status: "error", message: `${error.message}` });
//         }
//       })
//       .post(auth, async (req, res) => {
//         const { user_id } = req.headers;
//         const {
//           // when ever you are adding a clothe make sure to add productId+color+size
//           productId,
//           productCartId,
//           productImg,
//           productQuantity,
//           productColor,
//           productPrice,
//           productSize,
//           productName,
//         } = req.body;

//         try {
//           const cartData = await cartModel.findOne({ user_id });
//           const index = cartData.products.findIndex(
//             (ele) => ele.productCartId == productCartId
//           );
//           if (index == -1) {
//             // when products does not exist , create new proudct
//             const products = [
//               ...cartData.products,
//               {
//                 productId,
//                 productCartId,
//                 productImg,
//                 productQuantity,
//                 productColor,
//                 productPrice,
//                 productSize,
//                 productName,
//               },
//             ];
//             const newCart = await cartModel.findOneAndUpdate(
//               { user_id },
//               {
//                 products,
//               },
//               { new: true }
//             );
//             res
//               .status(200)
//               .json({ message: "add to cart", success: "add", newCart });
//           } else {
//             // let products = cartData.products;
//             // Object.assign(products[index], {
//             //   productId,
//             //   productCartId,
//             //   productImg,
//             //   productColor,
//             //   productPrice,
//             //   productSize,
//             //   productQuantity: products[index].productQuantity + 1,
//             // });
//             // const newCart = await cartModel.findOneAndUpdate(
//             //   { user_id },
//             //   {
//             //     products,
//             //   },
//             //   { new: true }
//             // );
//             res
//               .status(200)
//               .json({ message: "Product is in cart", success: "add" });
//           }
//         } catch (error) {
//           res.status(500).json({
//             status: "error",
//             message: `${error.message}`,
//           });
//         }
//       });

//     app.route(`/cart/:id`).delete(auth, async (req, res) => {
//       const { user_id } = req.headers;
//       const { id: productCartId } = req.params;
//       console.log(`request made to delete `, productCartId);
//       try {
//         // console.log(user_id);
//         const cartOfUser = await cartModel.findOne({ user_id });
//         // console.log(cartOfUser);
//         const products = cartOfUser.products.filter(
//           (ele) => ele.productCartId != productCartId
//         );
//         const dataAfterDeleted = await cartModel.findOneAndUpdate(
//           { user_id },
//           { products },
//           {
//             new: true,
//           }
//         );
//         res.status(200).json({
//           status: "success",
//           message: "data was deleted",
//           dataAfterDeleted,
//         });
//       } catch (error) {
//         res.status(500).json({ status: "error", message: `${error.message}` });
//       }
//     });

//     //   wishlist --> frontend DONE
//     app.route(`/wishlist`).get(auth, async (req, res) => {
//       const { user_id } = req.headers;
//       try {
//         const wishlistData = await wishlistModel.findOne({ user_id });
//         if (wishlistData) {
//           res.status(200).json({
//             status: "success",
//             message: "wishList fetched",
//             data: {
//               wishlistData,
//             },
//           });
//         } else {
//           res
//             .status(404)
//             .json({ status: "failed", message: "No Such Wishlist exists" });
//         }
//       } catch (error) {
//         res.status(500).json({ status: "error", message: `${error.message}` });
//       }
//     });
//     // add to wishlist from products --> frontend DONE
//     app.route(`/wishlist/add`).post(auth, async (req, res) => {
//       const { user_id } = req.headers;
//       const { productId, productImg, productPrice, productName } = req.body;
//       try {
//         // toggle true to make changes to the product in products
//         const newUpdateProduct = await productModel.findOneAndUpdate(
//           { _id: productId },
//           { in_wishlist: true },
//           { new: true }
//         );
//         // fetching wishlist for wishlist products array
//         const wishlist = await wishlistModel.findOne({ user_id });
//         var products = [
//           ...wishlist.products,
//           { productId, productImg, productPrice, productName },
//         ];
//         // updating products array
//         const newUpdatedWishList = await wishlistModel.findOneAndUpdate(
//           { user_id },
//           { products },
//           { new: true }
//         );
//         res.status(200).json({
//           status: "success",
//           message: "Added to wishlist",
//           newUpdatedWishList,
//         });
//       } catch (error) {
//         res.status(500).json({ status: "error", message: `${error.message}` });
//       }
//     });
//     // remove from wishlist --> frontend DONE
//     app.route(`/wishlist/remove`).post(auth, async (req, res) => {
//       const { user_id } = req.headers;
//       const { productId } = req.body;
//       try {
//         const updatedProduct = await productModel.findOneAndUpdate(
//           { _id: productId },
//           { in_wishlist: false },
//           { new: true }
//         );
//         const wishlist = await wishlistModel.findOne({ user_id });
//         var products = wishlist.products;
//         products = products.filter((ele) => ele.productId != productId);
//         const newUpdatedWishList = await wishlistModel.findOneAndUpdate(
//           { user_id },
//           { products },
//           { new: true }
//         );
//         res.status(200).json({ status: "success", newUpdatedWishList });
//       } catch (error) {
//         res.status(500).json({ status: "error", message: `${error.message}` });
//       }
//     });

//     // increment quantity by 1 --> frontend DONE
//     app.route(`/cart/addedBy1`).post(auth, async (req, res) => {
//       const { user_id } = req.headers;
//       const {
//         // when ever you are adding a clothe make sure to add productId+color+size
//         productCartId,
//       } = req.body;

//       try {
//         const cartData = await cartModel.findOne({ user_id });
//         const index = cartData.products.findIndex(
//           (ele) => ele.productCartId == productCartId
//         );

//         let products = cartData.products;
//         Object.assign(products[index], {
//           ...products[index],
//           productQuantity: products[index].productQuantity + 1,
//         });
//         const newCart = await cartModel.findOneAndUpdate(
//           { user_id },
//           {
//             products,
//           },
//           { new: true }
//         );
//         res.status(200).json({ success: "quantity increased + 1", newCart });
//       } catch (error) {
//         res.status(500).json({
//           status: "error",
//           message: `${error.message}`,
//         });
//       }
//     });

//     // decrement quantity by 2 --> frontend DONE
//     app.route(`/cart/subtractBy1`).post(auth, async (req, res) => {
//       const { user_id } = req.headers;
//       const {
//         // when ever you are adding a clothe make sure to add productId+color+size
//         productCartId,
//       } = req.body;

//       try {
//         const cartData = await cartModel.findOne({ user_id });
//         const index = cartData.products.findIndex(
//           (ele) => ele.productCartId == productCartId
//         );

//         let products = cartData.products;
//         Object.assign(products[index], {
//           ...products[index],
//           productQuantity: products[index].productQuantity - 1,
//         });
//         const newCart = await cartModel.findOneAndUpdate(
//           { user_id },
//           {
//             products,
//           },
//           { new: true }
//         );
//         res.status(200).json({ success: "quantity increased + 1", newCart });
//       } catch (error) {
//         res.status(500).json({
//           status: "error",
//           message: `${error.message}`,
//         });
//       }
//     });

//     app.route(`/cart/clear`).get(auth, async (req, res) => {
//       const { user_id } = req.headers;
//       try {
//         const newCart = await cartModel.findOneAndUpdate(
//           { user_id },
//           { products: [] },
//           { new: true }
//         );
//         res.status(200).json({
//           status: "success",
//           message: "cart has been successfully cleared",
//           newCart,
//         });
//       } catch (err) {
//         res.status(500).json({ status: "error", message: `${err.message}` });
//       }
//     });

//     app.route(`/checkOut`).get(auth, async (req, res) => {
//       const { user_id, name } = req.headers;
//       try {
//         const { address } = await userModel.findOne({ _id: user_id });
//         const { products } = await cartModel.findOne({ user_id });
//         if (address) {
//           res.status(200).json({
//             status: "success",
//             message: "user-details fetched",
//             user_id,
//             name,
//             address,
//             products,
//           });
//         } else {
//           res.status(400).json({
//             status: "failed",
//             message: "failed to fetch user-details",
//           });
//         }
//       } catch (error) {
//         res.status(500).json({ status: "error", message: `${error.message}` });
//       }
//     });
//     app
//       .route(`/order`)
//       .post(auth, async (req, res) => {
//         const user_id = req.headers.user_id;
//         const { products, total } = req.body;
//         const newOrder = { orderId: uniqid(), total, products };
//         try {
//           const orderDocumentOfUser = await ordersModel.findOne({
//             userId: user_id,
//           });
//           const dataPushed = await ordersModel.findOneAndUpdate(
//             { userId: user_id },
//             {
//               // Orders: [...orderDocumentOfUser.Orders, newOrder],
//               $push: { Orders: newOrder },
//             },
//             { new: true }
//           );
//           if (dataPushed) {
//             res.status(200).json({ status: "successful", dataPushed });
//           }
//         } catch (err) {
//           res.status(500).json({ status: "failed", message: `${err.message}` });
//         }
//       })
//       .get(auth, async (req, res) => {
//         const { user_id } = req.headers;
//         try {
//           const data = await ordersModel.findOne({ userId: user_id });
//           if (data) {
//             res.status(200).json({ failed: "success", data });
//           } else {
//             res.status(400).json({
//               status: "failed",
//               message: "failed to fetch data from DataBase",
//               data,
//             });
//           }
//         } catch (err) {
//           res.status(500).json({ status: "error", message: `${err.message}` });
//         }
//       });

//     app.listen(process.env.PORT, () => console.log(`Web-server is Online`));
//   } catch (error) {
//     console.log(`Failed to Established DB_Connection : ${error.message}`);
//   }
// })();
