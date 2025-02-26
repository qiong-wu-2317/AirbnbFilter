# AirbnbFilter
Assignment3 Qiong Wu

## Installation

1. Install dependencies:
   ```sh
   npm install
   ```
2. Run the program:
   ```sh
   node .solution/main.js
   ```
3. JSDoc Documentation
   ```sh
   npm install -g jsdoc
   jsdoc src
   open out/index.html 
   ```

## Project Structure

```
│── solution/AirBnBDataHandler.js       Core data processing function
│── solution/AirBnBDataProcessor.js     main module to process data, include a UI interface
│── out                                 JsDoc HTML                       
│── .gitignore                          Git ignored files
│── eslint.config.js                    ESLint configuration for code quality
│── LICENSE                             Project license
│── package.json                        Project dependencies
│── README.md                           Documentation
```

## Functional Programming Principles

### Pure Function
```js
const filterListings = (data, filters) => data.filter(...);
```

### Counterexample: Impure Function
```js
let data = await readCsv('abc.csv')
const filterListings = (filters) => data.filter(...);
filterListings(filters1)
```
the function filterListings relies on external data variable


### Example: Higher-Order Function
```js
const createComparator = (getValue) => (a, b) => getValue(a) - getValue(b);
```

### Counterexample: Without Higher-Order Function
```js
const createComparator = () => (a, b) => {
    const getNumber = (item) => {
        const value = item?.toString().replace(/[$,]/g, '') || '0';
        return parseFloat(value) || 0;
    };
    return getNumber(a) - getNumber(b)
};
```
getNumber is used somewhere else, we can create a pure function getNumber and pass the function into createComparator


## GenAI
DeepSeek V1 is used

### 1 statement not clear
**Prompt:**  
*"when asking number of rooms which is more desired  accommodates, bathrooms, bedrooms"*
try to ask AI for 'number of rooms' is total rooms or bedrooms

### 2 create JSDoc
**Prompt:**  
*"document my code using JSDoc (paste code in)"*

**Response:**  
```js
/**
 * Airbnb Data Handler API
 * @typedef {Object} AirBnBHandler
 * @property {function(FilterParameters): AirBnBHandler} filter - Filters listings
 * @property {function(): AirBnBHandler} computeStats - Calculates statistics
 * @property {function(number): AirBnBHandler} rankHosts - Ranks top hosts
 * @property {function(string): AirBnBHandler} order - Sorts by property
 * @property {function(string): Promise<AirBnBHandler>} writeToFile - Exports to CSV
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
export const AirBnBDataHandler = (initialData = []) => {...}
```

### 3 read/write csv
*"how to read csv, how to write csv"*
AI code may use require(), I changed them to import manually
bugs for autoType part, fixed it by futher ask what is autoType


### 4 fix bug
**Prompt:**  
*"function order(property) {...}  order not working"*

**Response:**
add new function for me
```js
function order(property) {
    ...
    const cleanValue = (value) => {
      if (typeof value === 'string') {
        // Remove currency symbols and commas
        const cleaned = value.replace(/[$,]/g, '');
        return parseFloat(cleaned) || 0;
      }
      return Number(value) || 0;
    };
    ...
}
```
aware that price like '$100' must be transfered

### 5 asking to make pure function
**Prompt:**  
*"make function a pure function"*
```js
export function AirBnBDataHandler() {
  let data; // Stores the raw CSV data
  let filteredListings = []; // Stores the filtered listings
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
  },
  ...
}
```
**Response:**
```js
const filterListings = (data, filters) => data.filter(listing => {...});
export const AirBnBDataHandler = (initialData = []) => {
    ...
    const handler = {
        filter(filters) {
        const filtered = filterListings(data, filters);
        console.log('Number of listings found:', filtered.length);
        return AirBnBDataHandler(filtered);
        },
        ...
    }
    return handler
}
```
try to make all the functions to pure functions.





## Video  
[video](https://drive.google.com/file/d/1Ss4D1NisMfm64Zf3fEe3DmvtecKBR37u/view?usp=sharing) 

## what was the hardest and more rewarding parts of the process
For the pure function part, it is easy to create a function like 
```js
export function AirBnBDataHandler() {
  let data; // Stores the raw CSV data
  let filteredListings = []; // Stores the filtered listings
  function filter(filters) {
    filteredListings = data.filter((listing) => {...})
  },
  ...
}
```
The AirBnBDataHandler() function is pure, but the filter() function was not initially pure. After several attempts, I finally managed to make it pure with the help of GenAI. 
It's not easy to follow FP principles in JavaScript because its format is quite different from the Python and Java I used for backend development. Previously, I mainly used JavaScript for frontend tasks and didn't pay much attention to FP principles. Through this experience, I managed to overcome some challenges.



## Creative Addition
1. I created an order function that allows lists to be sorted by a specified property before being output.
2. For the ranking part, I used a nested map to hash IDs by value names and counts, as displaying names provides better clarity.







