
const axios = require('axios').default;
const config = require("../example_config");

//Update shopping list
function updateShoppingList(params) {
    //Convert parameters to useful arrays
    var ingredients = JSON.parse(params.purchased);

    //Array of statements that will be sent in the axios request
    var statements = [];

    for (var i = 0; i < ingredients.length; i++) {
        //Update link from user to ingredient
        statements.push({
            "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user and i.name=$ingredient SET r.amount=$amount",
            "parameters": {
                "user": params.user,
                "ingredient": ingredients[i].name,
                "amount": ingredients[i].amount
            }
        });
    }
    
    return axios.post(config.url, {
        "statements": statements,
    });
}

module.exports.updateShoppingList = updateShoppingList;
