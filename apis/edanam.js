const axios = require('axios').default;
const config = require("../config");

function fetchNutritionalInfo(ingredient, type) {
    if (type === "number") {
        return axios.get(config.edanam_url
            + "?app_id=" + config.edanam_app_id
            + "&app_key=" + config.edanam_app_key
            + "&ingr=" + 100 + " " + ingredient);
    } else {
        return axios.get(config.edanam_url
            + "?app_id=" + config.edanam_app_id
            + "&app_key=" + config.edanam_app_key
            + "&ingr=" + 100 + " " + type + " " + ingredient);
    }
}

module.exports.fetchNutritionalInfo = fetchNutritionalInfo;