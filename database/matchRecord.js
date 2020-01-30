const axios = require('axios').default;
const config = require("../config");

//Check if the user and the ingredient are already in the app
function matchIngredient (params) {
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

//Check if the diet is already in the app
function matchDiet (diet) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (n:Diet) WHERE n.name=$name RETURN id(n)",
                "parameters": {
                    "name": diet,
                }
            },
        ],
    })
}

//Check if the health concern is already in the app
function matchHealth (health) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (n:Health) WHERE n.name=$name RETURN id(n)",
                "parameters": {
                    "name": health,
                }
            },
        ],
    })
}

module.exports.matchIngredient = matchIngredient;
module.exports.matchRecipe = matchRecipe;
module.exports.matchDiet = matchDiet;
module.exports.matchHealth = matchHealth;