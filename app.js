import express from "express";
import mysql from "mysql2";
const app = express();

// Create a connection to the database
const db = mysql.createConnection({
  host: "localhost", // Replace with your host
  user: "root", // Replace with your MySQL username
  password: "DareDevil@45", // Replace with your MySQL password
  database: "url_shortner",
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database 'url_shortner'");
});

db.query("DESCRIBE url_shortner", (err, schema) => {
  if (err) throw err;
  console.log("\nTable: url_shortner");
  console.table(schema);
});

// db.query("SELECT * FROM url_shortner", (err,values)=>{
//   console.table(values);
// });

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use((req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  next();
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

function generateShortUrl(length = 6) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let shortUrl = "";

  for (let i = 0; i < length; i++) {
    shortUrl += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return shortUrl;
}

function thousandEntries() {
  const startTime = performance.now(); // Start timer

  const values = Array(1)
    .fill()
    .map(() => ["originalurl.com", generateShortUrl()]);

  const totalRows = values.length; // Store the total number of rows to insert

  db.query(
    "INSERT IGNORE INTO url_shortner (original_url, short_code) VALUES ?",
    [values],
    (err, result) => {
      if (err) {
        console.error("Error inserting rows:", err);
        return;
      }
      const endTime = performance.now(); // End timer
      const duration = (endTime - startTime).toFixed(2); // Get duration in ms


      // Check if we need to insert ignored rows
      const ignoredRows = totalRows - result.affectedRows;
      if (ignoredRows > 0) {
        console.log(`Attempting to insert ${ignoredRows} ignored rows...`);

        const values = Array(ignoredRows)
          .fill()
          .map(() => ["originalurl.com", generateShortUrl()]);

        db.query(
          "INSERT IGNORE INTO url_shortner (original_url, short_code) VALUES ?",
          [values],
          (err, result) => {
            if (err) {
              console.error("Error inserting rows:", err);
              return;
            }
            console.log(`Successfully inserted ${result.affectedRows} rows second attempt`);
            // console.log(`Query took ${duration}ms to complete`);
          }
        );
      }
      console.log(`Successfully inserted ${result.affectedRows} rows`);
      console.log(`Query took ${duration}ms to complete`);

    }
  );
}

thousandEntries();

db.query("SHOW TABLE STATUS LIKE 'url_shortner'", (err, result) => {
  if (err) {
    console.error("Error fetching table status:", err);
    return;
  }
  const tableInfo = result[0];
  const sizeInMB =
    (tableInfo.Data_length + tableInfo.Index_length) / (1024 * 1024);
  console.log(`Size of table 'url_shortner': ${sizeInMB.toFixed(2)} MB`);
  
  // New code to log total number of rows
  console.log(`Total number of rows in 'url_shortner': ${tableInfo.Rows}`);
});

db.query("SELECT COUNT(*) AS total FROM url_shortner", (err, result) => {
  if (err) {
    log_error("Error counting rows:", err);
    return;
  }
  log_info(`Total number of rows in 'url_shortner': ${result[0].total}`);
});
