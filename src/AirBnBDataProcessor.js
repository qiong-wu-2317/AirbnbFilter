import { readFile, writeFile } from 'fs/promises';
import { csvParse, autoType } from "d3-dsv";
import {AirBnBDataHandler} from './AirBnBDataHandler.js';
import readline from "readline";

/**
 * Airbnb Data Processor module.
 * This module provides a high-level interface for processing Airbnb listings data.
 *
 * @module AirBnBDataProcessor
 */

/**
 * Creates an instance of the Airbnb Data Processor.
 *
 * @returns {Object} An object containing methods to interact with Airbnb listings data.
 */
function AirBnBDataProcessor() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  /**
   * Reads and parses a CSV file containing Airbnb listings data.
   *
   * @param {string} filePath - The path to the CSV file.
   * @returns {Promise<Object>} A promise that resolves when the file is successfully read and parsed.
   * @throws {Error} If the file cannot be read or parsed.
   */
  async function readCsv(filePath){
    try {
      const fileContent = await readFile(filePath, "utf-8");
      let data = csvParse(fileContent, autoType);
      console.log(`CSV file ${filePath} successfully loaded.`);
      return data
    } catch (error) {
      console.error("Error reading the file:", error);
      process.exit(1);
    }
  }

  /**
   * Prompts user for filter criteria via CLI
   * @async
   * @returns {Promise<Filters>} Object containing filter values
   */
  async function askFilterData() {
    let filters = {
      price_min: 0,
      price_max: 0,
      room_min: 0,
      room_max: 0,
      score_min: 0,
      score_max: 0,
    };
    return new Promise((resolve) => {
      console.log("Enter values in 'min,max' format (e.g., 0,100). Press Enter to skip.");
      rl.question("Price Range (min,max): ", (price) => {
        rl.question("Number of Rooms (min,max): ", (room) => {
          rl.question("Review Score (min,max): ", (score) => {
            if (price) {
              const [min, max] = price.split(",").map(Number);
              filters[`price_min`] = !isNaN(min) ? min : 0;
              filters[`price_max`] = !isNaN(max) ? max : 0;
            }
            if (room) {
              const [min, max] = room.split(",").map(Number);
              filters[`room_min`] = !isNaN(min) ? min : 0;
              filters[`room_max`] = !isNaN(max) ? max : 0;
            }
            if (score) {
              const [min, max] = score.split(",").map(Number);
              filters[`score_min`] = !isNaN(min) ? min : 0;
              filters[`score_max`] = !isNaN(max) ? max : 0;
            }
            console.log("Filters imported.")
            console.log(filters);
            resolve(filters);
          });
        });
      });
    });
  }

  /**
   * Prompts user for output file path
   * @async
   * @returns {Promise<string>} Path for output file
   */
  async function askOutputPath() {
    return new Promise(async (resolve) => {
      // Ask the user for the output file path
      rl.question("Enter the file path (e.g., result.csv): ", async (outputFilePath) => {
        rl.close()
        resolve(outputFilePath); // Resolve the promise on success
      });
    });
  }

  /**
   * Prompts user for sorting criteria
   * @async
   * @returns {Promise<string>} Comma-separated list of sorting fields
   */
  async function askOrder() {
    return new Promise(async (resolve) => {
      rl.question("Order lists (e.g., price, price_pre_room, bedrooms, accommodates, review_scores_rating), Press Enter to skip: ", async (order) => {
        resolve(order);
      });
    });
  }

  /**
   * Runs the Airbnb Data Processor application.
   *
   * @returns {Promise<void>} A promise that resolves when the application completes successfully.
   */
  async function run() {
    const filePath = 'listings.csv'
    
    console.log("Step 1: Read the CSV file")
    let data = await readCsv(filePath)

    const myHandler = AirBnBDataHandler(data)

    console.log("\nStep 2: Ask for filters")
    let filterData = {
      price_min: 0,
      price_max: 0,
      room_min: 0,
      room_max: 0,
      score_min: 0,
      score_max: 0,
    };
    filterData = await askFilterData(); 

    
    console.log("\nStep 3: Apply filters")
    let filtered = myHandler.filter(filterData).computeStats().rankHosts()

    console.log("\nStep 4: Write results to file")
    const order = await askOrder()
    if(order){
      filtered = await filtered.order(order)
    }
    const path = await askOutputPath()
    if(path){
      await filtered.writeToFile(path);
    }
  }

  return { run };
}

// Main execution
(async () => {
  try {
    const app = AirBnBDataProcessor(); // Initialize the app
    await app.run(); // Run the app
    process.exit(0); // Exit with success status code
  } catch (error) {
    console.error('Error running the application:', error);
    process.exit(1); // Exit with failure status code
  }
})();


















