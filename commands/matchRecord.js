const axios = require('axios').default;
const config = require("../example_config");

//Check if the user and the ingredient are already in the app
function matchIngredient (params, key) {
        return axios.post(config.url, {
            "statements": [
                {
                    "statement": "MATCH (n:User) WHERE n.name=$name RETURN id(n)",
                    "parameters": {
                        "name": params.user,
                    }
                },
                {
                    "statement": "MATCH (n:Ingredient) WHERE n.name=$name RETURN id(n)",
                    "parameters": {
                        "name": params.name,
                    }
                }
            ],
        })
}

//Check if the user and the recipe are already in the app
function matchRecipe(params) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (n:User) WHERE n.name=$name RETURN id(n)",
                "parameters": {
                    "name": params.user,
                }
            },
            {
                "statement": "MATCH (n:Recipe) WHERE n.name=$name RETURN id(n)",
                "parameters": {
                    "name": params.name,
                }
            }
        ],
    })
} 

module.exports.matchIngredient = matchIngredient;
module.exports.matchRecipe = matchRecipe;