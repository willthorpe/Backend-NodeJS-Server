var TescoAPI = require("tesco-api-node");
const config = require("../config");

function fetchPriceData(ingredient, amount, type) {
    var tesco = new TescoAPI(config.tesco_primary_key);
    var options = {
        limit:1,
        offset:0,
    };

    if (type === "number") {
        options.query = amount + " " + ingredient
    } else {
        options.query = amount + " " + type + " " + ingredient
    }

    return tesco.grocerySearch(options);
}

module.exports.fetchPriceData = fetchPriceData;