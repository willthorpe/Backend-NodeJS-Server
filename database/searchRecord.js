const axios = require('axios').default;
const config = require("../config");
const kmeans = require('ml-kmeans');

//Search the recipes
function searchRecipe(userIngredients, recipes, searchParameters, diets, allergies) {
    var recipeScores = [];
    var preferenceTotal = 0;
    var kMeansData = [];
    var kMeansLabels = [];

    //Calculate preference weighting compared to other preferences
    for (var i = 0; i < searchParameters.length; i++) {
        preferenceTotal = preferenceTotal + searchParameters[i]
    }
    if(preferenceTotal !== 0){
        for (var j = 0; j < searchParameters.length; j++) {
            searchParameters[j] = parseFloat(searchParameters[j]) / parseFloat(preferenceTotal)
        }
    }

    console.log(searchParameters);
    /**
     * Algorithm Section 1 - Remove recipes with ingredients not matching allergies
     */
    for (var k = 0; k < recipes[0].data.length; k++) {
        console.log(recipes[0].data[0].row[0].name);
        kMeansData.push([]);
        var recipeScore = [];
        for (var preference = 0; preference < searchParameters.length; preference++) {
            recipeScore.push(0);
        }
        var totalRecipeWeight = 0;
        var meetsAllergies = true;
        for (var l = 0; l < recipes[0].data[k].row[1].length; l++) {
            //Exclude ingredients that don't meet allergy concerns
            var ingredient = recipes[0].data[k].row[1][l];
            var ingredientAllergies = ingredient[0].healthLabels.split(",");
            for (var a = 0; a < allergies.length; a++) {
                if (allergies[a].value === 1 && !ingredientAllergies.includes(allergies[a].name)) {
                    meetsAllergies = false
                }
            }
            totalRecipeWeight = totalRecipeWeight + ingredient[1].weight;
        }
        if (meetsAllergies === false) {
            //Break out of the loop here to avoid any more calculations
            continue;
        }

        /**
         * Algorithm Part 2 - Order recipes by score descending
         */
        for (var m = 0; m < recipes[0].data[k].row[1].length; m++) {
            //Check Prefer Lighter Weight - 1
            var ingredient = recipes[0].data[k].row[1][m];
            if (!kMeansLabels.includes(ingredient[0].name)) {
                kMeansLabels.push(ingredient[0].name);
            }
            kMeansData[k][kMeansLabels.indexOf(ingredient[0].name)] = ingredient[1].weight;
            if (ingredient[1].weight <= 300) {
                recipeScore[1] += ingredient[1].weight / totalRecipeWeight;
            }
            //Check Prefer Matching Diet - 7
            var matchDiets = true;
            var ingredientDiets = ingredient[0].dietLabels.split(",");
            for (var d = 0; d < diets.length; d++) {
                if (diets[d].value === 1 && !ingredientDiets.includes(diets[d].name)) {
                    matchDiets = false;
                }
            }
            if (matchDiets === true) {
                recipeScore[7] += ingredient[1].weight / totalRecipeWeight;
            }
            var varietyIngredient = true;
            for (var n = 0; n < userIngredients.data.length; n++) {
                var userIngredient = userIngredients.data[n].row[0];
                //Check Prefer Owned Ingredients - 0
                if (ingredient[0].name === userIngredient.name && userIngredient.amount >= ingredient[1].amount) {
                    recipeScore[0] += ingredient[1].weight / totalRecipeWeight;
                } else if (ingredient[0].name === userIngredient.name)
                //Check Prefer Variety - 2
                    varietyIngredient = false;
            }
            if (varietyIngredient === true) {
                recipeScore[2] += ingredient[1].weight / totalRecipeWeight;
            }
        }

        //Check Popular Recipes - 3
        var popularity = recipes[1].data[0].row[0];
        recipeScore[3] += popularity / 50;

        //Check Prefer Less Ingredients - 4
        var ingredients = recipes[0].data[k].row[1].length;
        if (ingredients <= 10) {
            recipeScore[4] += (10 - ingredients) / 10;
        }

        //Check Prefer Less Complex Recipes - 5
        var method = JSON.parse(recipes[0].data[k].row[0].method).length;
        if (method <= 10) {
            recipeScore[5] += (10 - method) / 10;
        }

        //Check Prefer Shorter Recipes - 6
        var time = parseInt(recipes[0].data[k].row[0].cookTime) + parseInt(recipes[0].data[k].row[0].prepTime)
        if (time <= 60) {
            recipeScore[6] += (60 - time) / 10;
        }
	console.log("score");
	console.log(recipeScore);

        //Work out final score
        for(var parameter = 0; parameter < recipeScore.length; parameter++){
            recipeScore[parameter] *= 100 * searchParameters[parameter]
        }
	console.log("final score");
	console.log(recipeScore);

        //Add to score array
        var recipeDetails = recipes[0].data[k].row[0];
        var methodList = JSON.parse(recipes[0].data[k].row[0].method);
        var ingredientList = recipes[0].data[k].row[1];
        recipeScores.push({
            recipe: recipeDetails,
            method: methodList,
            ingredients: ingredientList,
            score: Math.round(recipeScore.reduce((a,b) => a+b, 0))
        });
    }
    console.log(recipeScores);
    //Sort recipes by score descending:
    recipeScores.sort(function (a, b) {
        return b.score - a.score
    });

    /**
     * Algorithm Part 3 - K-Means Clustering to pick highest of similar recipes
     */
    //Prepare Data - fill in blanks
    //Make arrays same length
    for (var o = 0; o < kMeansData.length; o++) {
        while (kMeansData[o].length < kMeansData[kMeansData.length - 1].length) {
            kMeansData[o].push(0);
        }
    }
    //Fill in blanks
    for (var p = 0; p < kMeansData.length; p++) {
        for (var q = 0; q < kMeansData[p].length; q++) {
            if (kMeansData[p][q] == null) {
                kMeansData[p][q] = 0;
            }
        }
    }
    //Normalise Data - values from min to max (0-1) for all ingredients
    for (var r = 0; r < kMeansLabels.length; r++) {
        var max = 0;
        //Find maximum
        for (var s = 0; s < kMeansData.length; s++) {
            if (kMeansData[s][r] > max) {
                max = kMeansData[s][r];
            }
        }
        //Normalise data
        for (var t = 0; t < kMeansData.length; t++) {
            //Minimum in normalisation equation is 0 so no effect
            kMeansData[t][r] = kMeansData[t][r] / max;
        }
    }
    console.log(kMeansData);

    //Find clusters
    let clusters = kmeans
    (
        kMeansData,
        kMeansData.length,
        {
            initialization: 'kmeans++',
            tolerance: 0.1
        }
    );

    console.log(clusters);
    //Find duplicate clusters
    var duplicates = [];
    for (var u = 0; u < clusters.centroids.length; u++) {
        if (clusters.centroids[u].size > 1) {
            duplicates.push(u);
        }
    }

    //Remove duplicate elements
    if (duplicates.length > 0) {
        for (var v = clusters.clusters.length - 1; v >= 0; v--) {
            if (duplicates.includes(clusters.clusters[v]) && clusters.clusters[v] > -1) {
                var count = clusters.clusters.reduce(function (n, val) {
                    return n + (val === clusters.clusters[v]);
                }, 0);
                if (count > 1) {
                    //Remove recipe from array
                    recipeScores.splice(v, 1);
                    clusters.clusters[v] = -1;
                }
                console.log(clusters);
            }
        }
    }

    return recipeScores;
}

module.exports.searchRecipe = searchRecipe;
