
const axios = require('axios').default;
const config = require("../config");

//Update shopping list
function updateShoppingList(params) {
    //Convert parameters to useful arrays
    var ingredients = JSON.parse(params.purchased);

    //Array of statements that will be sent in the axios request
    var statements = [];

    for (var i = 0; i < ingredients.length; i++) {
        //Update link from user to ingredient
        statements.push({
            "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user and i.name=$ingredient SET r.amount=$amount + r.amount RETURN r",
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

//Update ingredients
function updateIngredient(params) {
    //Array of statements that will be sent in the axios request
    var statements = [];
    statements.push({
        "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user and i.name=$ingredient SET r.amount=$amount, r.type=$type, r.location=$location RETURN r",
        "parameters": {
            "user": params.user,
            "ingredient": params.name,
            "amount": params.amount,
            "type": params.type,
            "location": params.location
        }
    });

    return axios.post(config.url, {
        "statements": statements,
    });
}

//Update ingredient amount
function updateIngredientAmounts(params) {
    //Convert parameters to useful arrays
    var ingredients = JSON.parse(params.purchased);

    //Array of statements that will be sent in the axios request
    var statements = [];

    for (var i = 0; i < ingredients.length; i++) {
        //Update link from user to ingredient
        statements.push({
            "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user and i.name=$ingredient SET r.amount= r.amount - $amount RETURN r",
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

//Update ingredients
function updateRecipeSummary(params) {
    //Array of statements that will be sent in the axios request
    var statements = [];
    statements.push({
        "statement": "MATCH (r: Recipe) WHERE r.name=$name SET r.tag=$tag, r.servings=$servings, r.prepTime=$prepTime, r.cookTime=$cookTime RETURN r",
        "parameters": {
            "user": params.user,
            "name": params.name,
            "tag": params.tag,
            "servings": parseInt(params.servings),
            "cookTime": parseInt(params.cookTime),
            "prepTime" : parseInt(params.prepTime)
        }
    });
    console.log(statements);
    return axios.post(config.url, {
        "statements": statements,
    });
}

module.exports.updateShoppingList = updateShoppingList;
module.exports.updateIngredientAmounts = updateIngredientAmounts;
module.exports.updateIngredient = updateIngredient;
module.exports.updateRecipeSummary = updateRecipeSummary;
