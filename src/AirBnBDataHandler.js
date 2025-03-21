/**
 * Airbnb Data Handler Module
 * @module AirBnBDataHandler
 */

import { stringify as csvFormat } from 'csv-stringify/sync';
import { writeFile } from 'fs/promises';

/**
 * Extracts a numeric value from an object property, cleaning currency formatting
 * @param {Object} item - The object containing the property to extract
 * @param {string} prop - The property name to extract
 * @returns {number} The parsed numeric value
 * @example
 * getNumber({ price: '$100.50' }, 'price'); // returns 100.5
 */
const getNumber = (item, prop) => {
  const value = item[prop]?.toString().replace(/[$,]/g, '') || '0';
  return parseFloat(value) || 0;
};

/**
 * Creates a comparator function for sorting objects
 * @param {function} getValue - Function to extract comparison value from items
 * @returns {function} Comparator function for array sorting
 * @example
 * const comparePrice = createComparator(item => item.price);
 * items.sort(comparePrice);
 */
const createComparator = (getValue) => (a, b) => getValue(a) - getValue(b);

/**
 * Filter parameters for listing selection
 * @typedef {Object} FilterParameters
 * @property {number} [price_min=0] - Minimum price filter
 * @property {number} [price_max=0] - Maximum price filter
 * @property {number} [room_min=0] - Minimum bedrooms filter
 * @property {number} [room_max=0] - Maximum bedrooms filter
 * @property {number} [score_min=0] - Minimum review score filter
 * @property {number} [score_max=0] - Maximum review score filter
 */

/**
 * Filters listings based on specified criteria
 * @param {Array<Object>} data - Array of listing objects
 * @param {FilterParameters} filters - Filter configuration object
 * @returns {Array<Object>} New array with filtered listings
 */
const filterListings = (data, filters) => data.filter(listing => {
  const price = getNumber(listing, 'price');
  const bedrooms = getNumber(listing, 'bedrooms');
  const score = getNumber(listing, 'review_scores_rating');

  return (
    (!filters.price_max || (price >= filters.price_min && price <= filters.price_max)) &&
    (!filters.room_max || (bedrooms >= filters.room_min && bedrooms <= filters.room_max)) &&
    (!filters.score_max || (score >= filters.score_min && score <= filters.score_max))
  );
});

/**
 * Calculated statistics object
 * @typedef {Object} ListingStats
 * @property {number} count - Total number of listings
 * @property {number} averagePrice - Average price across listings
 * @property {number} avgPricePerRoom - Average price per room
 * @property {number} validListings - Count of listings with valid host IDs
 */

/**
 * Calculates statistics for a set of listings
 * @param {Array<Object>} data - Array of listing objects
 * @returns {ListingStats} Calculated statistics object
 */
const calculateStats = data => {
  const totalPrice = data.reduce((sum, item) => sum + getNumber(item, 'price'), 0);
  const totalRooms = data.reduce((sum, item) => sum + getNumber(item, 'bedrooms'), 0);
  
  return {
    count: data.length,
    averagePrice: totalPrice / data.length,
    avgPricePerRoom: totalPrice / totalRooms,
    validListings: data.filter(item => 
      typeof item.host_id === 'number' && item.host_id > 0
    ).length
  };
};

/**
 * Host ranking entry format
 * @typedef {Array} HostRanking
 * @property {string} 0 - Host ID
 * @property {Object} 1 - Host data
 * @property {string} 1.name - Host name
 * @property {number} 1.count - Number of listings
 */

/**
 * Ranks hosts by their number of listings
 * @param {Array<Object>} data - Array of listing objects
 * @returns {Array<HostRanking>} Sorted array of host rankings
 */
const rankHosts = data => Object.entries(
  data.reduce((acc, listing) => ({
    ...acc,
    [listing.host_id]: {
      name: listing.host_name,
      count: (acc[listing.host_id]?.count || 0) + 1
    }
  }), {})
).sort((a, b) => b[1].count - a[1].count);

/**
 * Airbnb Data Handler API
 * @typedef {Object} AirBnBHandler
 * @property {function(FilterParameters): AirBnBHandler} filter - Filters listings
 * @property {function(): AirBnBHandler} computeStats - Calculates statistics
 * @property {function(number): AirBnBHandler} rankHosts - Ranks top hosts
 * @property {function(string): AirBnBHandler} order - Sorts by property
 * @property {function(string): Promise<AirBnBHandler>} writeToFile - Exports to CSV
 * @property {function(): Array<Object>} getData - Returns current dataset
 */

/**
 * Creates a new Airbnb Data Handler instance
 * @param {Array<Object>} [initialData=[]] - Initial dataset
 * @returns {AirBnBHandler} Handler instance with chainable methods
 * @example
 * const handler = AirBnBDataHandler(data)
 *   .filter(filters)
 *   .order('price')
 *   .computeStats();
 */
export const AirBnBDataHandler = (initialData = []) => {
  /** @type {Object} */
  let data = initialData

  const handler = {
    /**
     * Filters listings using provided criteria
     * @param {FilterParameters} filters - Filter parameters
     * @returns {AirBnBHandler} New handler instance with filtered data
     */
    filter(filters) {
      const filtered = filterListings(data, filters);
      console.log('Number of listings found:', filtered.length);
      return AirBnBDataHandler(filtered);
    },

    /**
     * Calculates and displays statistics for current dataset
     * @returns {AirBnBHandler} Current handler instance
     */
    computeStats() {
      const stats = calculateStats(data);
      console.log('\nStatistics:');
      console.log(
        'Number of valid listings (valid host_id):',
        stats.validListings
      );
      console.log('Average price:', stats.averagePrice);
      console.log('Average price per room:', stats.avgPricePerRoom);
      return handler;
    },

    /**
     * Displays top ranked hosts
     * @param {number} [limit=10] - Number of top hosts to show
     * @returns {AirBnBHandler} Current handler instance
     */
    rankHosts(limit = 10) {
      const ranked = rankHosts(data).slice(0, limit);
      console.log('\nTop 10 hosts by number of listings:');
      ranked.map(([id, data], index) => {
        console.log(`${index + 1}. ${data.name} (id: ${id}): ${data.count} listings`);
      });
      return handler;
    },

    /**
     * Sorts listings by specified property
     * @param {string} property - Numeric property to sort by
     * @returns {AirBnBHandler} New handler instance with sorted data
     */
    order(property) {
      const comparator = createComparator(item => getNumber(item, property));
      const sorted = [...data].sort(comparator);
      return AirBnBDataHandler(sorted);
    },

    /**
     * Writes current dataset to CSV file
     * @param {string} outputFilePath - Path to output file
     * @returns {Promise<AirBnBHandler>} Promise resolving to current handler
     * @throws {Error} If file write operation fails
     */
    async writeToFile(outputFilePath) {
      try {
        await writeFile(outputFilePath, csvFormat(data, { header: true }));
        console.log(`Data saved to ${outputFilePath}`);
        return this;
      } catch (error) {
        throw new Error(`File write failed: ${error.message}`);
      }
    },
  };

  return handler;
};
