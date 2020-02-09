const axios = require('axios').default;
const config = require("../config");

function fetchNutritionalInfo(ingredient, amount, type) {
    if (type === "number") {
        return axios.get(config.edanam_url
            + "?app_id=" + config.edanam_app_id
            + "&app_key=" + config.edanam_app_key
            + "&ingr=" + amount + " " + ingredient);
    } else {
        return axios.get(config.edanam_url
            + "?app_id=" + config.edanam_app_id
            + "&app_key=" + config.edanam_app_key
            + "&ingr=" + amount + " " + type + " " + ingredient);
    }
}

module.exports.fetchNutritionalInfo = fetchNutritionalInfo;