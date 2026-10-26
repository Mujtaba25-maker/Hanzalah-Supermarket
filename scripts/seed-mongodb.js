require("dotenv").config();

const { seedDatabase } = require("../lib/database");

if (process.argv.includes("--force")) {
  console.error("Destructive reseeding is disabled. Use a separate empty demo database.");
  process.exit(1);
}

seedDatabase()
  .then(() => {
    console.log("MongoDB indexes, settings and configured bootstrap accounts initialized without resetting records.");
    process.exit(0);
  })
  .catch(error => {
    console.error(error.message);
    process.exit(1);
  });
