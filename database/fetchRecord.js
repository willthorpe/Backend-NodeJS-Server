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

//Fetch all the ingredients related to the user. 
function fetchShoppingList(params) {
    var user = params.user;
    var calendar = JSON.parse(params.calendar)[0];
    var recipes = [];
    //Array of statements that will be sent in the axios request
    var statements = [];

    //Manipulate recipes grouping by name
    for (var i = 0; i < calendar.breakfast.length; i++) {
        if (!recipes.includes(calendar.breakfast[i])) {
            recipes.push(calendar.breakfast[i]);
        }
    }

    for (var j = 0; j < calendar.lunch.length; j++) {
        if (!recipes.includes(calendar.lunch[j])) {
            recipes.push(calendar.lunch[j]);
        }
    }

    for (var k = 0; k < calendar.dinner.length; k++) {
        if (!recipes.includes(calendar.dinner[k])) {
            recipes.push(calendar.dinner[k]);
        }
    }

//Form statements
    for (var l = 0; l < recipes.length; l++) {
        statements.push({
            "statement": "MATCH (u:User)-[p:has]->(i:Ingredient)<-[r:contains]-(re:Recipe) WHERE u.name=$user and re.name=$recipe RETURN i,r.amount, p.amount, p.type",
            "parameters": {
                "user": user,
                "recipe": recipes[l],
            }
        });
    }

    return axios.post(config.url, {
        "statements": statements
    })
}

module.exports.fetchIngredients = fetchIngredients;
module.exports.fetchRecipes = fetchRecipes;
module.exports.fetchRecipeIngredients = fetchRecipeIngredients;
module.exports.fetchShoppingList = fetchShoppingList;


