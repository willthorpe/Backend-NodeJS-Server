const axios = require('axios').default;
const config = require("../config");
const edanam = require("../apis/edanam");

//Create nodes and relationships between user and ingredients
async function createIngredientRelationships(params) {
    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    statements.push({
        "statement": "MERGE (n:User {name:$name}) RETURN n",
        "parameters": {
            "name": params.user,
        }
    });

    //Create ingredient
    var ingredientParameters = await fetchNutrition(params.name, params.amount, params.type);
    statements.push({
        "statement": "MERGE (n:Ingredient {name:$name, dietLabel:$dietLabels,healthLabels:$healthLabels}) RETURN n",
        "parameters": {
            'name': params.name,
            'dietLabels': ingredientParameters.dietLabels,
            'healthLabels': ingredientParameters.healthLabels
        }
    });

    //Create link from user to ingredient
    statements.push({
        "statement": "MATCH (u:User),(i:Ingredient) WHERE u.name=$user and i.name=$ingredient CREATE(u)- [r: has { amount: $amount, type: $type, location: $location, useByDate: $useByDate}] -> (i) return u, i",
        "parameters": {
            "user": params.user,
            "ingredient": params.name,
            "amount": params.amount,
            "type": params.type,
            "useByDate": params.useByDate,
            "location": params.location,
        }
    });
    return axios.post(config.url, {
        "statements": statements,
    });
}

//Create nodes and relationships between user and recipes
async function createRecipeRelationships(params) {
    //Convert parameters to useful arrays
    var ingredients = JSON.parse(params.ingredients);

    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    statements.push({
        "statement": "MERGE (n:User {name:$name}) RETURN n",
        "parameters": {
            "name": params.user,
        }
    });

    //Create recipe
    statements.push({
        "statement": "MERGE (n:Recipe {name:$name,tag:$tag,servings:$servings,prepTime:$prepTime,cookTime:$cookTime,method:$method }) RETURN n",
        "parameters": {
            "name": params.name,
            "tag": params.tag,
            "servings": params.servings,
            "prepTime": params.prepTime,
            "cookTime": params.cookTime,
            "method": params.methods
        }
    });

    //Create link from user to recipe
    statements.push({
        "statement": "MATCH (u:User),(re:Recipe) WHERE u.name=$user and re.name=$recipe CREATE(u)- [r: makes] -> (re) return u, re",
        "parameters": {
            "user": params.user,
            "recipe": params.name,
        }
    });

    //Create links from recipe to ingredients
    for (var i = 0; i < ingredients.length; i++) {
        if (ingredients[i] != null) {
            var ingredientParameters = await fetchNutrition(ingredients[i]["name"], ingredients[i]["amount"], ingredients[i]["type"]);
            statements.push({
                "statement": "MATCH (i:Ingredient),(re:Recipe) WHERE i.name=$ingredient and re.name=$recipe CREATE(re)- [r: contains { amount: $amount, type: $type,weight:$weight, calories:$calories, energy:$energy, fat:$fat, carbs:$carbs, protein:$protein}] -> (i) return i, re",
                "parameters": {
                    "ingredient": ingredients[i]['name'],
                    "recipe": params.name,
                    "amount": parseInt(ingredients[i]['amount']),
                    "type": ingredients[i]['type'],
                    "weight": ingredientParameters[k].weight,
                    "calories": ingredientParameters[k].calories,
                    "energy": ingredientParameters[k].energy,
                    "fat": ingredientParameters[k].fat,
                    "carbs": ingredientParameters[k].carbs,
                    "protein": ingredientParameters[k].protein
                }
            });
        }
    }
    return axios.post(config.url, {
        "statements": statements,
    });
}

//Create nodes and relationships between user and recipes
async function createRecipeRelationshipsBulk(recipes) {
    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    statements.push({
        "statement": "MERGE (n:User {name:$name}) RETURN n",
        "parameters": {
            "name": recipes[0].user,
        }
    });
    for (var i = 0; i < recipes.length; i++) {
        var ingredients = JSON.parse(recipes[i]['ingredients']);
        var ingredientParametersList = [];
        //Add ingredients if not already in database
        for (var j = 0; j < ingredients.length; j++) {
            var ingredientParameters = await fetchNutrition(ingredients[j].name, ingredients[j].amount, ingredients[j].type);
            ingredientParametersList.push(ingredientParameters);
            statements.push(
                {
                "statement": "MERGE (n:Ingredient {name:$name, dietLabels:$dietLabels,healthLabels:$healthLabels}) RETURN n",
                    "parameters": {
                        'name': ingredients[j]["name"],
                        'dietLabels': ingredientParameters.dietLabels,
                        'healthLabels': ingredientParameters.healthLabels
                    }
                },
            );
        }

        //Create recipe
        statements.push({
            "statement": "MERGE (n:Recipe {name:$name,tag:$tag,servings:$servings,prepTime:$prepTime,cookTime:$cookTime,method:$method}) RETURN n",
            "parameters": {
                "name": recipes[i].name,
                "tag": '',
                "servings": recipes[i].servings,
                "prepTime": recipes[i].prepTime,
                "cookTime": recipes[i].cookTime,
                "method": recipes[i].methods,
                },
            },
            {
                "statement": "MATCH (u:User),(re:Recipe) WHERE u.name=$user and re.name=$recipe CREATE(u)- [r: makes] -> (re) return u, re",
                "parameters": {
                    "user": recipes[0].user,
                    "recipe": recipes[i].name,
                }
            }
        );

        //Create links from recipe to ingredients
        for (var k = 0; k < ingredients.length; k++) {
            statements.push({
                "statement": "MATCH (i:Ingredient),(re:Recipe) WHERE i.name=$ingredient and re.name=$recipe CREATE(re)- [r: contains { amount: $amount, type: $type,weight:$weight, calories:$calories, energy:$energy, fat:$fat, carbs:$carbs, protein:$protein}] -> (i) return i, re",
                "parameters": {
                    "ingredient": ingredients[k]['name'],
                    "recipe": recipes[i].name,
                    "amount": parseInt(ingredients[k]['amount']),
                    "type": ingredients[k]['type'],
                    "weight": ingredientParametersList[k].weight,
                    "calories": ingredientParametersList[k].calories,
                    "energy": ingredientParametersList[k].energy,
                    "fat": ingredientParametersList[k].fat,
                    "carbs": ingredientParametersList[k].carbs,
                    "protein": ingredientParametersList[k].protein
                }
            });
        }
    }
    console.log(statements);
    return axios.post(config.url, {
        "statements": statements,
    });
}

async function fetchNutrition(ingredient, amount, type) {
    var nutrition = await edanam.fetchNutritionalInfo(ingredient, amount, type);
    nutrition = nutrition.data;
    var ingredientParameters = {
        "name": ingredient,
        "calories": nutrition.calories,
        "weight": nutrition.totalWeight,
        "dietLabels": nutrition.dietLabels.toString(),
        "healthLabels": nutrition.healthLabels.toString()
    };

    //Nutrition data
    ingredientParameters["energy"] = 0;
    ingredientParameters["fat"] = 0;
    ingredientParameters["carbs"] = 0;
    ingredientParameters["protein"] = 0;

    if (nutrition.totalNutrients.ENERC_KCAL) {
        ingredientParameters["energy"] = nutrition.totalNutrients.ENERC_KCAL.quantity;
    }
    if (nutrition.totalNutrients.FAT) {
        ingredientParameters["fat"] = nutrition.totalNutrients.FAT.quantity;
    }
    if (nutrition.totalNutrients.CHOCDF) {
        ingredientParameters["carbs"] = nutrition.totalNutrients.CHOCDF.quantity;
    }
    if (nutrition.totalNutrients.PROCNT) {
        ingredientParameters["protein"] = nutrition.totalNutrients.PROCNT.quantity;
    }

    return ingredientParameters;
}

module.exports.createIngredientRelationships = createIngredientRelationships;
module.exports.createRecipeRelationships = createRecipeRelationships;
module.exports.createRecipeRelationshipsBulk = createRecipeRelationshipsBulk;
