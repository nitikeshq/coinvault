console.log("Testing getUserByEmail...");
const { storage } = require("./server/storage");
storage.getUserByEmail("admin@cryptowallet.com").then(user => console.log("User found:", user ? "YES" : "NO", user?.email)).catch(err => console.error("Error:", err));
