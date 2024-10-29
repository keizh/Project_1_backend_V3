const mongoose = require("mongoose");
require("dotenv").config();
const MONGODB_API_STRING = process.env.MONGODB;
console.log(MONGODB_API_STRING);

const db_establish_connection = async () => {
  try {
    const db_object = await mongoose.connect(MONGODB_API_STRING);
    if (db_object) {
      // isDbConnected = true; // Set to true once the connection is established
      console.log("Data_Base connection has been secured");
    }
  } catch (error) {
    console.log(
      "Failed to make DB connection: from db_establish_connection function"
    );
    throw error;
  }
};

module.exports = { db_establish_connection };
