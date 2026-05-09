require("dotenv").config();

const { seedDatabase } = require("../lib/database");

const force = process.argv.includes("--force");

seedDatabase({ force })
  .then(() => {
    console.log(force ? "MongoDB Atlas reseeded." : "MongoDB Atlas seeded if empty.");
    process.exit(0);
  })
  .catch(error => {
    console.error(error.message);
    process.exit(1);
  });
