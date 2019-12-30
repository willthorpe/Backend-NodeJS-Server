const axios = require('axios').default;
const config = require("../example_config");


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

module.exports.deleteRecipe = deleteRecipe;
