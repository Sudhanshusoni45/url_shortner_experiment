import express from "express";
import mysql from "mysql2";
import chalk from "chalk";
const app = express();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "DareDevil@45",
  database: "url_shortner",
});

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

  const values = Array(1000000)
    .fill()
    .map(() => ["originalurl.com", generateShortUrl()]);

  const totalRows = values.length;

  db.query(
    "INSERT IGNORE INTO url_shortner (original_url, short_code) VALUES ?",
    [values],
    (err, resultMain) => {
      let resultMini;

      if (err) {
        console.error("Error inserting rows:", err);
        return;
      }

      const ignoredRows = totalRows - resultMain.affectedRows;
      if (ignoredRows > 0) {
        console.log(`Attempting to insert ${ignoredRows} ignored rows...`);

        const values = Array(ignoredRows)
          .fill()
          .map(() => ["originalurl.com", generateShortUrl()]);

        db.query(
          "INSERT IGNORE INTO url_shortner (original_url, short_code) VALUES ?",
          [values],
          (err, result) => {
            resultMini = result;
            if (err) {
              console.error("Error inserting rows:", err);
              return;
            }
            console.log(
              `Successfully inserted ${result.affectedRows} rows second attempt`
            );
          }
        );
      }
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      console.log(
        chalk.green(
          `Successfully inserted sum total of ${resultMain.affectedRows + resultMini?.affectedRows} rows`
        )
      );
      console.log(chalk.blue(`Query took ${duration}ms to complete`));
    }
  );
}

thousandEntries();

// output size of table
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
});

//output total no of rows in table
db.query("SELECT COUNT(*) AS total FROM url_shortner", (err, result) => {
  if (err) {
    console.error("Error counting rows:", err);
    return;
  }
  console.log(`Total number of rows in 'url_shortner': ${result[0].total}`);
});
