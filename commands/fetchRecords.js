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

module.exports.fetchIngredients = fetchIngredients;