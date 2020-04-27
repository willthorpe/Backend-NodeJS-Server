const axios = require('axios').default;
const config = require("../config");

function pullRecipes(number) {
    return axios.get(
        config.spoonacular_url
        + "?apiKey=" + config.spoonacular_key
        + "&number=" + number
        + "&tags=main course" 
    );
}

function formatRecipes(number, recipes) {
    var newRecipes = [];
    for (var i = 0; i < number; i++) {
        //For each recipe map the API data to the graph database parameters
        var recipeInfo = {
            'name': recipes[i]['title'],
            'servings': recipes[i]['servings'],
            'prepTime': (recipes[i]['preparationMinutes']) ? recipes[i]['preparationMinutes'] : 10,
            'cookTime': (recipes[i]['cookingMinutes']) ? recipes[i]['cookingMinutes'] : recipes[i]['readyInMinutes'] - 10,
            'ingredients': [],
            'methods': [],
            'user':'admin'
        };
        //Fetch each ingredient and format data into name, amount/measurement triples
        for (var j = 0; j < recipes[i]['extendedIngredients'].length; j++) {
            recipeInfo['ingredients'].push(
                {
                    'name': recipes[i]['extendedIngredients'][j]['name'],
                    'amount': recipes[i]['extendedIngredients'][j]['measures']['metric']['amount'],
                    'measurement': recipes[i]['extendedIngredients'][j]['measures']['metric']['unitLong'],
                }
            )
        }
        //Fetch the method by line one by one
        for (var k = 0; k < recipes[i]['analyzedInstructions'][0]['steps'].length; k++) {
            recipeInfo['methods'].push(
                recipes[i]['analyzedInstructions'][0]['steps'][k]['step']
            )
        }
        recipeInfo['ingredients'] = JSON.stringify(recipeInfo['ingredients']);
        recipeInfo['methods'] = JSON.stringify(recipeInfo['methods']);
        newRecipes.push(recipeInfo);
    }
    return newRecipes;
}

module.exports.pullRecipes = pullRecipes;
module.exports.formatRecipes = formatRecipes;