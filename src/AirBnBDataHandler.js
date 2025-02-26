import { readFile, writeFile } from 'fs/promises';
import { csvParse, autoType } from "d3-dsv";
import { stringify as csvFormat } from 'csv-stringify/sync';



/**
 * Airbnb Data Handler module.
 * This module provides functionality to load, filter, compute statistics, rank hosts, order, and save Airbnb listings data.
 *
 * @module AirBnBDataHandler
 */

/**
 * Creates an instance of the Airbnb Data Handler.
 *
 * @returns {Object} An object containing methods to interact with Airbnb listings data.
 */
export function AirBnBDataHandler() {
  let data; // Stores the raw CSV data
  let filteredListings = []; // Stores the filtered listings

  /**
   * Reads and parses a CSV file containing Airbnb listings data.
   *
   * @param {string} filePath - The path to the CSV file.
   * @returns {Promise<void>} A promise that resolves when the file is successfully read and parsed.
   * @throws {Error} If the file cannot be read or parsed.
   */
  async function readCsv(filePath){
    try {
      const fileContent = await readFile(filePath, "utf-8");
      data = csvParse(fileContent, autoType);
      console.log(`CSV file ${filePath} successfully loaded.`);
    } catch (error) {
      console.error("Error reading the file:", error);
      process.exit(1);
    }
  }

  /**
   * Filters the listings based on the provided criteria.
   *
   * @param {Object} filters - The filtering criteria.
   * @param {number} filters.price_min - The minimum price.
   * @param {number} filters.price_max - The maximum price.
   * @param {number} filters.room_min - The minimum number of bedrooms.
   * @param {number} filters.room_max - The maximum number of bedrooms.
   * @param {number} filters.score_min - The minimum review score.
   * @param {number} filters.score_max - The maximum review score.
   * @returns {void}
   */
  function filter(filters) {
    filteredListings = data.filter((listing) => {
      const price = parseFloat(listing.price?.toString().replace(/[$,]/g, '')) || 0;
      const bedrooms = parseInt(listing.bedrooms) || 0;
      const score = parseFloat(listing.review_scores_rating) || 0;

      const priceFilter = filters.price_max === 0 || (price >= filters.price_min && price <= filters.price_max);
      const roomFilter = filters.room_max === 0 || (bedrooms >= filters.room_min && bedrooms <= filters.room_max);
      const scoreFilter = filters.score_max === 0 || (score >= filters.score_min && score <= filters.score_max);
      return priceFilter && roomFilter && scoreFilter;
    });
    console.log('Number of listings found:', filteredListings.length);
  }

  /**
   * Computes and logs statistics for the filtered listings.
   *
   * @returns {void}
   */
  function computeStats() {
    console.log('Statistics:');
    console.log(
      'Number of valid listings (valid host_id):',
      filteredListings.filter((row) => typeof row.host_id === 'number' && row.host_id > 0).length
    );

    let totalPrice = 0,
      totalRooms = 0;
    filteredListings.forEach((row) => {
      const price = parseFloat(row.price?.toString().replace(/[$,]/g, '')) || 0;
      totalPrice += price;
      const rooms = parseInt(row.bedrooms) || 0;
      totalRooms += rooms;
      row.price_per_room = (price / (rooms || 1)).toFixed(2); // Add price per room
    });

    console.log('Average price:', Math.round((totalPrice / filteredListings.length) * 100) / 100);
    console.log('Average price per room:', Math.round((totalPrice / totalRooms) * 100) / 100);
  }

  /**
   * Ranks hosts by the number of listings they have and logs the top 10 hosts.
   *
   * @returns {void}
   */
  function rankHosts() {
    const hosts = filteredListings.reduce((acc, listing) => {
      acc[listing.host_id] = acc[listing.host_id] || { name: listing.host_name, count: 0 };
      acc[listing.host_id].count++;
      return acc;
    }, {});

    const sortedHosts = Object.entries(hosts).sort((a, b) => b[1].count - a[1].count);
    console.log('\nTop 10 hosts by number of listings:');
    sortedHosts.slice(0, 10).forEach(([id, data], index) => {
      console.log(`${index + 1}. ${data.name} (id: ${id}): ${data.count} listings`);
    });
  }

  /**
   * Sorts the filtered listings by the specified property.
   *
   * @param {string} property - The property to sort by (e.g., 'price', 'price_per_room').
   * @returns {void}
   * @throws {Error} If the property does not exist in the listings.
   */
  function order(property) {
    const lastIndex = filteredListings.length - 1;
    console.log(`Before ordering, first ${property}: ${filteredListings[0][property]}, last: ${filteredListings[lastIndex][property]}`);
  
    const getNumericValue = (item) => {
      const value = item[property]?.toString().replace(/[$,]/g, '') || '0';
      return parseFloat(value) || 0;
    };
  
    filteredListings.sort((a, b) => {
      const valueB = getNumericValue(b);
      const valueA = getNumericValue(a);
      return valueA - valueB;
    });
  
    console.log(`After ordering, first ${property}: ${filteredListings[0][property]}, last: ${filteredListings[lastIndex][property]}`);
  }
  

  /**
   * Writes the filtered listings to a CSV file.
   *
   * @param {string} outputFilePath - The path to the output file.
   * @returns {Promise<void>} A promise that resolves when the file is written successfully.
   * @throws {Error} If the file cannot be written.
   */
  async function writeIntoFile(outputFilePath) {
    try {
      const csvData = csvFormat(filteredListings, { header: true });
      await writeFile(outputFilePath, csvData);
      console.log(`Filtered listings successfully saved to ${outputFilePath}`);
    } catch (error) {
      console.error('Error writing to the file:', error);
    }
  }

  // Expose methods and data
  return {
    filteredListings,
    readCsv,
    filter,
    computeStats,
    rankHosts,
    order,
    writeIntoFile,
  };
}


