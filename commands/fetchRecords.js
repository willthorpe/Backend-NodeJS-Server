const axios = require('axios').default;
const config = require("../example_config");

//Fetch all the ingredients related to the user. 
function fetchIngredients(user) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user RETURN i,r",
                "parameters": {
                    "user": user,
                }
            },
        ],
    })
}

//Fetch all the recipes related to the user. 
function fetchRecipes(user) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User)-[r:makes]->(re:Recipe) WHERE u.name=$user RETURN re",
                "parameters": {
                    "user": user,
                }
            },
        ],
    })
}

//Fetch all the recipes related to the user. 
function fetchRecipeIngredients(user) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User)-[p:makes]->(re:Recipe)-[r:contains]->(i:Ingredient) WHERE u.name=$user RETURN re,i,r",
                "parameters": {
                    "user": user,
                }
            },
        ],
    })
}

module.exports.fetchIngredients = fetchIngredients;
module.exports.fetchRecipes = fetchRecipes;
module.exports.fetchRecipeIngredients = fetchRecipeIngredients;


