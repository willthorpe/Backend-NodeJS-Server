const axios = require('axios').default;
const config = require("../config");

//Search the recipes
function searchRecipe(userIngredients, recipes, searchParameters) {
    var order = [
        'Prefer Owned Ingredients',
        'Prefer Lighter Weight',
        'Prefer Variety',
        'Prefer Popular Recipes',
        'Prefer Less Ingredients',
        'Prefer Less Complex Recipes',
        'Prefer Shorter Recipes'
    ];
    var recipeScores = []
    var total = 0;
    //Calculate preference weighting compared to other preferences
    for (var i = 0; i < searchParameters.length; i++) {
        total = total + searchParameters[i]
    }
    for (var j = 0; j < searchParameters.length; j++) {
        searchParameters[j] = searchParameters[j] / total * 100
    }

    var recipeName = null; 
    for (var k = 0; k < recipes[0].data.length; k++) {
        console.log(recipes[0].data[k].row[0].name);
        var score = 0;
        var totalRecipeWeight = 0    
        
        /**
        * Check over ingredients
        */
        for (var l = 0; l < recipes[0].data[k].row[1].length; l++) {
            var weightOne = recipes[0].data[k].row[1][l][0].weight / 100;
            totalRecipeWeight = totalRecipeWeight + (parseInt(recipes[0].data[k].row[1][l][1].amount * weightOne));
        }

        console.log(totalRecipeWeight);
        for (var m = 0; m < recipes[0].data[k].row[1].length; m++) {
            //Check Prefer Lighter Weight - 1
            console.log("Lighter Weight");
            var weightOne = recipes[0].data[k].row[1][m][0].weight / 100;
            if (weightOne <= 300) {
                score = score + (searchParameters[1] * ((recipes[0].data[k].row[1][m][1].amount * weightOne) / totalRecipeWeight));
                console.log(score);
            }


            for (var n = 0; n < userIngredients.data.length; n++) {
                if (recipes[0].data[k].row[1][m][0].name == userIngredients.data[n].row[0].name && userIngredients.data[n].row[0].amount >= recipes[0].data[k].row[1][m][1].amount) {
                    //Check Prefer Owned Ingredients - 0
                    console.log("Owned Ingredients");
                    var weightOne = recipes[0].data[m].row[1][m][0].weight / 100;
                    score = score + (searchParameters[0] * ((recipes[0].data[m].row[1][m][1].amount * weightOne) / totalRecipeWeight));
                    console.log(score);
                }
            }
        }

        //Check Prefer Variety - 2

        //Check Popular Recipes - 3

        //Check Prefer Less Ingredients - 4
        console.log("Less ingredients");
        ingredients = recipes[0].data[k].row[1].length;
        if (ingredients <= 10) {
            score = score + (searchParameters[4] / ingredients);
            console.log(score);
        }

        //Check Prefer Less Complex Recipes - 5
        console.log("Less complex recipes");
        method = JSON.parse(recipes[0].data[k].row[0].method).length;
        if (method <= 10) {
            score = score + (searchParameters[5] / method);
            console.log(score);
        }

        //Check Prefer Shorter Recipes - 6
        console.log("Shorter Recipes");
        time = parseInt(recipes[0].data[k].row[0].cookTime) + parseInt(recipes[0].data[k].row[0].prepTime)
        if (time <= 60) {
            score = score + (searchParameters[6] / time);
            console.log(score);
        }

        var recipeDetails = recipes[0].data[k].row[0];
        var ingredientList = recipes[0].data[k].row[1];
        recipeScores.push({recipe:recipeDetails, ingredients:ingredientList, score : score });
    }
    return recipeScores;
}

module.exports.searchRecipe = searchRecipe;