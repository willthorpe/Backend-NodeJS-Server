const axios = require('axios').default;
const config = require("./example_config");

//Check if the ingredient and user are already in the app
function matchParameters (params) {
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

module.exports.matchParameters = matchParameters;