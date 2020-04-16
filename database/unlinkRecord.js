const axios = require('axios').default;
const config = require("../config");

//Delete ingredient for one user
function deleteIngredient(params) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User {name:$user})-[r:has]-(i:Ingredient {name:$ingredient}) DELETE r RETURN u",
                "parameters": {
                    "user": params.user,
                    "ingredient": params.name
                }
            },
        ],
    });
}

//Delete recipe for one user
function deleteRecipe(params) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User {name:$user})-[r:makes]-(re:Recipe {name:$recipe}) DELETE r RETURN u",
                "parameters": {
                    "user": params.user,
                    "recipe": params.name
                }
            },
        ],
    });
}

module.exports.deleteIngredient = deleteIngredient;
module.exports.deleteRecipe = deleteRecipe;
