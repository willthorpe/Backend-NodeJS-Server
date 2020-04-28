const axios = require('axios').default;
const config = require("../config");

/**
 * Fetch nutritional data from Edamam API
 * @param ingredient
 * @param amount
 * @param measurement
 * @returns {Promise<AxiosResponse<T>>}
 */
function fetchNutritionalInfo(ingredient, amount, measurement) {
    if (measurement === "number") {
        return axios.get(config.edamam_url
            + "?app_id=" + config.edamam_app_id
            + "&app_key=" + config.edamam_app_key
            + "&ingr=" + amount + " " + ingredient);
    } else {
        return axios.get(config.edamam_url
            + "?app_id=" + config.edamam_app_id
            + "&app_key=" + config.edamam_app_key
            + "&ingr=" + amount + " " + measurement + " " + ingredient);
    }
}

module.exports.fetchNutritionalInfo = fetchNutritionalInfo;