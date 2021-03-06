var TescoAPI = require("tesco-api-node");
const config = require("../config");

/**
 * Fetch UK price data from Tesco API
 * @param ingredient
 * @param amount
 * @param measurement
 * @returns {*|Promise|Promise<unknown>}
 */
function fetchPriceData(ingredient, amount, measurement) {
    var tesco = new TescoAPI(config.tesco_primary_key);
    var options = {
        limit:1,
        offset:0,
    };

    if (measurement === "number") {
        options.query = amount + " " + ingredient
    } else {
        options.query = amount + " " + measurement + " " + ingredient
    }

    return tesco.grocerySearch(options);
}

module.exports.fetchPriceData = fetchPriceData;