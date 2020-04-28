const axios = require('axios').default;
const config = require("../config");
const create = require("../database/createRecord");

/**
 * Update details in the shopping list
 * @param params
 * @returns {Promise<AxiosResponse<T>>}
 */
async function updateShoppingList(params) {
    //Convert parameters to useful arrays
    var ingredients = JSON.parse(params.purchased);

    //Array of statements that will be sent in the axios request
    var statements = [];

    for (var i = 0; i < ingredients.length; i++) {
        var parameters = await create.fetchIngredientInfo(ingredients[i]['name'], ingredients[i]['amount'], ingredients[i]['measurement']);

        //Update link from user to ingredient
        statements.push({
            "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user and i.name=$ingredient SET r.amount=$amount + r.amount, r.price=$price RETURN r",
            "parameters": {
                "user": params.user,
                "ingredient": ingredients[i].name,
                "amount": ingredients[i].amount,
                "price": parameters.price,
            }
        });
    }
    
    return axios.post(config.url, {
        "statements": statements,
    });
}

/**
 * Update ingredient details
 * @param params
 * @returns {Promise<AxiosResponse<T>>}
 */
async function updateIngredient(params) {
    //Array of statements that will be sent in the axios request
    var parameters = await create.fetchIngredientInfo(params.name, params.amount, params.measurement);
    var statements = [];
    statements.push({
        "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user and i.name=$ingredient SET r.amount=$amount, r.measurement=$measurement, r.location=$location, r.price=$price RETURN r",
        "parameters": {
            "user": params.user,
            "ingredient": params.name,
            "amount": params.amount,
            "measurement": params.measurement,
            "price": parameters.price,
            "location": params.location
        }
    });

    return axios.post(config.url, {
        "statements": statements,
    });
}

/**
 * Update amount of ingredients in shopping list
 * @param params
 * @returns {Promise<AxiosResponse<T>>}
 */
async function updateIngredientAmounts(params) {
    //Convert parameters to useful arrays
    var ingredients = JSON.parse(params.ingredients);

    //Array of statements that will be sent in the axios request
    var statements = [];

    for (var i = 0; i < ingredients.length; i++) {
        var parameters = await create.fetchIngredientInfo(ingredients[i]['name'], ingredients[i]['amount'], ingredients[i]['measurement']);
        //Update link from user to ingredient
        statements.push({
            "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user and i.name=$ingredient SET r.amount= r.amount - $amount, r.price = $price RETURN r",
            "parameters": {
                "user": params.user,
                "ingredient": ingredients[i].name,
                "amount": ingredients[i].amount,
                "price": parameters.price,
            }
        });
    }

    return axios.post(config.url, {
        "statements": statements,
    });
}

/**
 * Update summary of the recipe
 * @param params
 * @returns {Promise<AxiosResponse<T>>}
 */
function updateRecipeSummary(params) {
    //Array of statements that will be sent in the axios request
    var statements = [];
    statements.push({
        "statement": "MATCH (r: Recipe{name:$name}) set r.tag=$tag, r.servings=$servings, r.prepTime=$prepTime, r.cookTime=$cookTime RETURN r",
        "parameters": {
            "user": params.user,
            "name": params.name,
            "tag": params.tag,
            "servings": parseInt(params.servings),
            "cookTime": parseInt(params.cookTime),
            "prepTime" : parseInt(params.prepTime)
        }
    });
    return axios.post(config.url, {
        "statements": statements,
    });
}

/**
 * Update method for the recipe
 * @param params
 * @returns {Promise<AxiosResponse<T>>}
 */
function updateRecipeMethod(params) {
    //Array of statements that will be sent in the axios request
    var statements = [];
    statements.push({
        "statement": "MATCH (r: Recipe{name:$name}) set r.method=$method",
        "parameters": {
            "user": params.user,
            "name": params.name,
            "method": params.method,
        }
    });
    return axios.post(config.url, {
        "statements": statements,
    });
}

/**
 * Update method for the recipe
 * @param params
 * @returns {Promise<AxiosResponse<T>>}
 */
async function updateRecipeIngredients(params)  {
    var ingredients = JSON.parse(params.ingredients);

    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create links from recipe to ingredients
    for (var i = 0; i < ingredients.length; i++) {
        if (ingredients[i] != null) {
            var ingredientParameters = await create.fetchIngredientInfo(ingredients[i]["name"], ingredients[i]["amount"], ingredients[i]["measurement"]);
            //Double check ingredient created
            statements = create.createIngredient(ingredients[i]["name"], ingredientParameters, statements);
            statements = create.createIngredientUserRelationships(params.user, ingredients[i]["name"], 0, ingredients[i]["measurement"], '', ingredientParameters, statements);

            //Add links to recipe
            statements = create.createIngredientRecipeRelationships(ingredients[i]["name"], ingredients[i]["amount"], ingredients[i]["measurement"], params.name, ingredientParameters, statements);
        }
    }

    return axios.post(config.url, {
        "statements": statements,
    });
}

module.exports.updateShoppingList = updateShoppingList;
module.exports.updateIngredientAmounts = updateIngredientAmounts;
module.exports.updateIngredient = updateIngredient;
module.exports.updateRecipeSummary = updateRecipeSummary;
module.exports.updateRecipeMethod = updateRecipeMethod;
module.exports.updateRecipeIngredients = updateRecipeIngredients;
