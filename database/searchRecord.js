const axios = require('axios').default;
const config = require("../config");

//Search the recipes
function searchRecipe(userIngredients, recipes, searchParameters, diets, allergies) {
    //var order = [
        //'Prefer Owned Ingredients',
        //'Prefer Lighter Weight',
        //'Prefer Variety',
        //'Prefer Popular Recipes',
        //'Prefer Less Ingredients',
        //'Prefer Less Complex Recipes',
        //'Prefer Shorter Recipes'
        //'Prefer Matching Diet',
    //];
    var recipeScores = []
    var total = 0;
    //Calculate preference weighting compared to other preferences
    for (var i = 0; i < searchParameters.length; i++) {
        total = total + searchParameters[i]
    }
    for (var j = 0; j < searchParameters.length; j++) {
        searchParameters[j] = searchParameters[j] / total * 100
    }
    console.log(searchParameters);
    for (var k = 0; k < recipes[0].data.length; k++) {
        console.log(recipes[0].data[k].row[0].name);
        var score = 0;
        var totalRecipeWeight = 0;    
        var meetsAllergies = true;
        /**
        * Check over ingredients
        */
        for (var l = 0; l < recipes[0].data[k].row[1].length; l++) {
            /**
             * Exclude ingredients that don't meet allergy concerns
            */
            var ingredientAllergies = recipes[0].data[k].row[1][l][0].healthLabels.split(",");
            console.log(ingredientAllergies);
	    for (var a = 0; a < allergies.length; a++) {
                if (allergies[a].value == 1 && !ingredientAllergies.includes(allergies[a].name)) {
                    meetsAllergies = false
                }
            }
            var weightOne = parseFloat(recipes[0].data[k].row[1][l][0].weight / 100);
            totalRecipeWeight = totalRecipeWeight + (parseInt(recipes[0].data[k].row[1][l][1].amount * weightOne));
        }
        if (meetsAllergies == false) {
            //Break out of the loop here to avoid any more calculations
            continue;
        }

        console.log(totalRecipeWeight);
        for (var m = 0; m < recipes[0].data[k].row[1].length; m++) {
            //Check Prefer Lighter Weight - 1
            console.log("Lighter Weight");
	    console.log(recipes[0].data[k].row[1][m][0]);
            var weightOne = parseFloat(recipes[0].data[k].row[1][m][0].weight / 100);
            if (weightOne <= 300) {
                score = score + (searchParameters[1] * ((recipes[0].data[k].row[1][m][1].amount * weightOne) / totalRecipeWeight));
                console.log(score);
            }
            for (var n = 0; n < userIngredients.data.length; n++) {
                var weightOne = parseFloat(recipes[0].data[k].row[1][m][0].weight / 100);
                var matchDiets = true;
                //Check Prefer Matching Diet - 7
		console.log("Prefer Matching Diet");
                var ingredientDiets = recipes[0].data[k].row[1][m][0].dietLabels.split(",");
		console.log(ingredientDiets);
                for (var d = 0; d < diets.length; d++) {
                    if (diets[d].value == 1 && !ingredientDiets.includes(diets[d].name)) {
                        matchDiets = false;   
                    }
                }
                if (matchDiets == true) {
                    score = score + (searchParameters[7] * ((recipes[0].data[k].row[1][m][1].amount * weightOne) / totalRecipeWeight));
                }
		console.log("yes");
                //Check Prefer Owned Ingredients - 0
		console.log("Prefer Owned Ingredients");
                if (recipes[0].data[k].row[1][m][0].name == userIngredients.data[n].row[0].name && userIngredients.data[n].row[0].amount >= recipes[0].data[k].row[1][m][1].amount) {
                    console.log("Owned Ingredient");
                    score = score + (searchParameters[0] * ((recipes[0].data[k].row[1][m][1].amount * weightOne) / totalRecipeWeight));
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
            score = score + (ingredients/10 * searchParameters[4]);
            console.log(score);
        }

        //Check Prefer Less Complex Recipes - 5
        console.log("Less complex recipes");
        method = JSON.parse(recipes[0].data[k].row[0].method).length;
        if (method <= 10) {
            score = score + (method/10 * searchParameters[5]);
            console.log(score);
        }

        //Check Prefer Shorter Recipes - 6
        console.log("Shorter Recipes");
        time = parseInt(recipes[0].data[k].row[0].cookTime) + parseInt(recipes[0].data[k].row[0].prepTime)
        if (time <= 60) {
            score = score + (time/60 * searchParameters[6]);
            console.log(score);
        }

        var recipeDetails = recipes[0].data[k].row[0];
        var methodList = JSON.parse(recipes[0].data[k].row[0].method);
        var ingredientList = recipes[0].data[k].row[1];
        recipeScores.push({recipe:recipeDetails, method: methodList, ingredients:ingredientList, score : Math.round(score) });
	console.log(recipeScores);
    }

    //Sort recipes by score descending:
    recipeScores.sort(function (a, b) {
        return b.score - a.score
    })

    return recipeScores;
}

module.exports.searchRecipe = searchRecipe;
