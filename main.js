import { readFile,writeFile } from "node:fs/promises";
import readline from "readline";
import { csvParse, autoType,csvFormat } from "d3-dsv";

const filePath = "listings.csv";
let data;

try {
  const fileContent = await readFile(filePath, "utf-8");
  data = csvParse(fileContent, autoType);
  console.log("CSV file successfully loaded.");
} catch (error) {
  console.error("Error reading the file:", error);
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let filters = {
  price_min: 0,
  price_max: 0,
  room_min: 0,
  room_max: 0,
  score_min: 0,
  score_max: 0,
};

console.log("Enter values in 'min,max' format (e.g., 0,100). Press Enter to skip.\n");

const askFilter = (question, key, callback) => {
  rl.question(question, (input) => {
    if (input) {
      const [min, max] = input.split(",").map(Number);
      filters[`${key}_min`] = !isNaN(min) ? min : 0;
      filters[`${key}_max`] = !isNaN(max) ? max : 0;
    }
    callback();
  });
};

const startFiltering = async () => {
  console.log(filters);
  let filteredListings = data.filter((listing) => {
    const price = parseFloat(listing.price?.toString().replace(/[$,]/g, "")) || 0;
    const bedrooms = parseInt(listing.bedrooms) || 0;
    const score = parseFloat(listing.review_scores_rating) || 0;

    return (
      price >= filters.price_min && price <= filters.price_max &&
      bedrooms >= filters.room_min && bedrooms <= filters.room_max &&
      score >= filters.score_min && score <= filters.score_max
    );
  });
  
  console.log("Number of listings found:", filteredListings.length);
  let hosts = {}
  filteredListings.forEach( (row) => {
    if(hosts[row.host_name]){
      hosts[row.host_name] ++
    }else{
      hosts[row.host_name] = 1
    }
    row.avg_price = (parseFloat(row.price?.toString().replace(/[$,]/g, "")) || 0) / (parseFloat(row.bedrooms) || 1);
    row.avg_price = Math.round(row.avg_price * 100) / 100;
  })
  let sortedHosts = Object.entries(hosts).sort((a, b) => b[1] - a[1]);
  console.log("\nTop 10 hosts by number of listings:");
  sortedHosts.slice(0, 10).forEach(([host, data], index) => {
    console.log(`${index + 1}. ${host}: ${data} listings`);
  });

  await writeIntoFile(filteredListings)
  rl.close();
};

askFilter("Price Range (min,max): ", "price", () => {
  askFilter("Number of Rooms (min,max): ", "room", () => {
    askFilter("Review Score (min,max): ", "score", startFiltering);
  });
});

const writeIntoFile = (filteredListings) => {
  return new Promise(async (resolve, reject) => {
    // Ask the user for the output file path
    rl.question("\nEnter the file path to save the filtered listings (e.g., filtered_listings.csv): ", async (outputFilePath) => {
      try {
        // Convert filteredListings to CSV format
        const csvData = csvFormat(filteredListings);
        await writeFile(outputFilePath, csvData);
        console.log(`Filtered listings successfully saved to ${outputFilePath}`);
        resolve(); // Resolve the promise on success
      } catch (error) {
        console.error("Error writing to the file:", error);
        reject(error); // Reject the promise on error
      } finally {
        rl.close();
      }
    });
  });
};











