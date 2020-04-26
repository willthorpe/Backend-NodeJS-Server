const axios = require('axios').default;
const config = require("../config");

//Fetch all the ingredients related to the user. 
function fetchIngredients(user) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User)-[r:has]->(i:Ingredient) WHERE u.name=$user and r.amount > 0 RETURN i,r ORDER BY i.name",
                "parameters": {
                    "user": user,
                }
            },
        ],
    })
}

//Fetch a single recipe. 
function fetchRecipe(recipe) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User)-[r:makes]->(re:Recipe)-[p:contains]->(i:Ingredient) WHERE re.name=$name RETURN re,p,i",
                "parameters": {
                    "name": recipe,
                }
            },
        ],
    })
}

//Fetch all the recipes
function fetchAllRecipes(user) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User)-[m:makes]->(re:Recipe)-[r:contains]-> (i:Ingredient) where u.name <> $user RETURN distinct re,collect([i,r])",
                "parameters": {
                    "user": user,
                }
            },
            {
                "statement": "MATCH (re:Recipe)<-[r:makes]->(u:User) RETURN re,count(r)"
            },
        ],
    })
}

//Fetch all the recipes related to the user. 
function fetchRecipes(user) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User)-[p:makes]->(re:Recipe)-[r:contains]->(i:Ingredient) WHERE u.name=$user RETURN distinct re,collect([i,r]) ORDER BY re.name",
                "parameters": {
                    "user": user,
                }
            },
        ],
    })
}

//Fetch all the recipes related to the user.
function fetchRecipeGraphData(user) {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (u:User)-[p:makes]->(re:Recipe)-[r:contains]->(i:Ingredient) WHERE u.name=$user RETURN distinct re,collect([i,r])",
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
        if (recipes.findIndex(x => x.recipe === calendar.breakfast[i]) == -1) {
            recipes.push({ "recipe": calendar.breakfast[i], "number": 1 });
        } else {
            index = recipes.findIndex(x => x.recipe == calendar.breakfast[i]);
            recipes[index]["number"] = recipes[index]["number"] + 1;
        }
    }
    for (var j = 0; j < calendar.lunch.length; j++) {
        if (recipes.findIndex(x => x.recipe === calendar.lunch[i]) == -1) {
            recipes.push({ "recipe": calendar.lunch[i], "number": 1 });
        } else {
            index = recipes.findIndex(x => x.recipe == calendar.lunch[i]);
            recipes[index]["number"] = recipes[index]["number"] + 1;
        }
    }

    for (var k = 0; k < calendar.dinner.length; k++) {
        if (recipes.findIndex(x => x.recipe === calendar.dinner[i]) == -1) {
            recipes.push({ "recipe": calendar.dinner[i], "number": 1 });
        } else {
            index = recipes.findIndex(x => x.recipe == calendar.dinner[i]);
            recipes[index]["number"] = recipes[index]["number"] + 1;

        }
    }

    //Form statements
    for (var l = 0; l < recipes.length; l++) {
        statements.push({
            "statement": "MATCH (u:User)-[p:has]->(i:Ingredient)<-[r:contains]-(re:Recipe) " +
                "WHERE u.name=$user and re.name=$recipe " +
                "RETURN i,toInteger(r.amount)*$number, p.amount, p.type, toFloat(r.price)*$number, p.price",
            "parameters": {
                "user": user,
                "recipe": recipes[l]["recipe"],
                "number": recipes[l]["number"]
            }
        });
    }
    return axios.post(config.url, {
        "statements": statements
    })
}

module.exports.fetchIngredients = fetchIngredients;
module.exports.fetchRecipe = fetchRecipe;
module.exports.fetchRecipes = fetchRecipes;
module.exports.fetchAllRecipes = fetchAllRecipes;
module.exports.fetchShoppingList = fetchShoppingList;
module.exports.fetchRecipeGraphData = fetchRecipeGraphData;


