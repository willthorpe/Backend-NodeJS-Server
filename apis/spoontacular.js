const axios = require('axios').default;
const config = require("../config");

function pullRecipes(number) {
    return axios.get(
        config.spoontacular_url
        + "?apiKey=" + config.spoontacular_key
        + "&number=" + number
        + "&tags=main course" 
    );
}

function formatRecipes(number, recipes) {
    var newRecipes = [];
    for (var i = 0; i < number; i++) {
        var recipeInfo = {
            'name': recipes[i]['title'],
            'servings': recipes[i]['servings'],
            'prepTime': recipes[i]['preparationMinutes'],
            'cookTime': recipes[i]['cookingMinutes'],
            'ingredients': [],
            'methods': [],
            'user':'admin'
        };
        for (var j = 0; j < recipes[i]['extendedIngredients'].length; j++) {
            recipeInfo['ingredients'].push(
                {
                    'name': recipes[i]['extendedIngredients'][j]['name'],
                    'amount': recipes[i]['extendedIngredients'][j]['measures']['metric']['amount'],
                    'type': recipes[i]['extendedIngredients'][j]['measures']['metric']['unitLong'],
                }
            )
        }
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