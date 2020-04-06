const kmeans = require('ml-kmeans');

//Search the recipes
function searchRecipe(userIngredients, recipes, searchParameters, diets, allergies) {
    var recipeScores = [];
    var preferenceTotal = 0;
    var kMeansData = [];
    var kMeansLabels = [];

    /**
     * Algorithm Section 1 - Calculate parameter ratios
     */
    //Calculate preference weighting compared to other preferences
    for (let preference = 0; preference < searchParameters.length; preference++) {
        preferenceTotal = preferenceTotal + searchParameters[preference]
    }
    if (preferenceTotal !== 0) {
        for (let preference = 0; preference < searchParameters.length; preference++) {
            searchParameters[preference] = searchParameters[preference] / preferenceTotal
        }
    }
    /**
     * Algorithm Section 2 - Remove recipes with ingredients not matching allergies
     */
    for (var recipeNo = 0; recipeNo < recipes[0].data.length; recipeNo++) {
        kMeansData.push([]);
        var recipeScore = [];
        for (let preference = 0; preference < searchParameters.length; preference++) {
            recipeScore.push(0);
        }
        var totalRecipeWeight = 0;
        var meetsAllergies = true;
        for (let ingredientNo = 0; ingredientNo < recipes[0].data[recipeNo].row[1].length; ingredientNo++) {
            //Exclude ingredients that don't meet allergy concerns
            var ingredient = recipes[0].data[recipeNo].row[1][ingredientNo];
            var ingredientAllergies = ingredient[0].healthLabels.split(",");
            //Check each allergy against all user allergies
            for (var a = 0; a < allergies.length; a++) {
                if (allergies[a].value === 1 && !ingredientAllergies.includes(allergies[a].name)) {
                    meetsAllergies = false;
                    break;
                }
            }
            totalRecipeWeight += ingredient[1].weight;
        }
        if (meetsAllergies === false) {
            //Break out of the loop here to avoid any more calculations
            continue;
        }

        /**
         * Algorithm Section 3 - Calculate scores relating to ingredient weights
         */
        for (let ingredientNo = 0; ingredientNo < recipes[0].data[recipeNo].row[1].length; ingredientNo++) {
            //Check Prefer Lighter Weight - 1
            ingredient = recipes[0].data[recipeNo].row[1][ingredientNo];
            //Add the ingredient to the kmeans Array so recipe ingredients can be compared
            if (!kMeansLabels.includes(ingredient[0].name)) {
                kMeansLabels.push(ingredient[0].name);
            }
            //Add ingredient weight to kmeans Data
            kMeansData[recipeNo][kMeansLabels.indexOf(ingredient[0].name)] = ingredient[1].weight;
            //An ingredient of less or equal to 400 grams is considered light
            if (ingredient[1].weight <= 400) {
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

        /**
         * Algorithm Section 4 - Calculate scores not relating to ingredient weights
         */
            //Check Popular Recipes - 3
        var popularity = recipes[1].data[0].row[0];
        recipeScore[3] += popularity / 50;

        //Check Prefer Less Ingredients - 4
        var ingredients = recipes[0].data[recipeNo].row[1].length;
        if (ingredients <= 10) {
            recipeScore[4] += (10 - ingredients) / 10;
        }

        //Check Prefer Less Complex Recipes - 5
        var method = JSON.parse(recipes[0].data[recipeNo].row[0].method).length;
        if (method <= 10) {
            recipeScore[5] += (10 - method) / 10;
        }

        //Check Prefer Shorter Recipes - 6
        var time = parseInt(recipes[0].data[recipeNo].row[0].cookTime) + parseInt(recipes[0].data[recipeNo].row[0].prepTime)
        if (time <= 60) {
            recipeScore[6] += (60 - time) / 60;
        }

        //Work out final score
        for (var parameter = 0; parameter < recipeScore.length; parameter++) {
            recipeScore[parameter] *= 100 * searchParameters[parameter]
        }

        //Add to score array
        var recipeDetails = recipes[0].data[recipeNo].row[0];
        var methodList = JSON.parse(recipes[0].data[recipeNo].row[0].method);
        var ingredientList = recipes[0].data[recipeNo].row[1];
        recipeScores.push({
            recipeNo: recipeDetails,
            method: methodList,
            ingredients: ingredientList,
            score: Math.round(recipeScore.reduce((a, b) => a + b, 0))
        });
    }
    console.log(recipeScores);
    //Sort recipes by score descending:
    recipeScores.sort(function (a, b) {
        return b.score - a.score
    });

    /**
     * Algorithm Section 5 - kMeans Clustering to pick highest of similar recipes
     */
    //Prepare Data - fill in blanks
    //Make arrays same length
    for (var data = 0; data < kMeansData.length; data++) {
        while (kMeansData[data].length < kMeansData[kMeansData.length - 1].length) {
            kMeansData[data].push(0);
        }
    }
    //Fill in blanks
    for (let recipe = 0; recipe < kMeansData.length; recipe++) {
        for (let ingredient = 0; ingredient < kMeansData[recipe].length; ingredient++) {
            if (kMeansData[recipe][ingredient] == null) {
                kMeansData[recipe][ingredient] = 0;
            }
        }
    }
    //Normalise Data - values from min to max (0-1) for all ingredients
    for (let ingredient = 0; ingredient < kMeansLabels.length; ingredient++) {
        var max = 0;
        //Find maximum
        for (let recipe = 0; recipe < kMeansData.length; recipe++) {
            if (kMeansData[recipe][ingredient] > max) {
                max = kMeansData[recipe][ingredient];
            }
        }
        //Normalise data
        for (let recipe = 0; recipe < kMeansData.length; recipe++) {
            //Minimum in normalisation equation is 0 so no effect
            kMeansData[recipe][ingredient] = kMeansData[recipe][ingredient] / max;
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

    /**
     * Algorithm Section 6 - Find duplicates
     */
    console.log(clusters);
    //Find duplicate clusters
    var duplicates = [];
    for (let cluster = 0; cluster < clusters.centroids.length; cluster++) {
        if (clusters.centroids[cluster].size > 1) {
            duplicates.push(cluster);
        }
    }

    //Remove duplicate elements
    if (duplicates.length > 0) {
        for (let cluster = clusters.clusters.length - 1; cluster >= 0; cluster--) {
            if (duplicates.includes(clusters.clusters[cluster]) && clusters.clusters[cluster] > -1) {
                var count = clusters.clusters.reduce(function (n, val) {
                    return n + (val === clusters.clusters[cluster]);
                }, 0);
                if (count > 1) {
                    //Remove recipe from array
                    recipeScores.splice(cluster, 1);
                    clusters.clusters[cluster] = -1;
                }
                console.log(clusters);
            }
        }
    }

    return recipeScores;
}

module.exports.searchRecipe = searchRecipe;
