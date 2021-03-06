const axios = require('axios').default;
const config = require("../config");
const edamam = require("../api/edamam");
const tesco = require("../api/tesco");

/**
 * Create nodes and relationships between user and ingredients
 * @param params
 * @returns {Promise<AxiosResponse<T>>}
 */
async function createIngredientNodes(params) {
    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    statements = createUser(params.user, statements);

    //Create ingredient
    var ingredientParameters = await fetchIngredientInfo(
        params.name, params.amount, params.measurement
    );
    statements = createIngredient(
        params.name, ingredientParameters, statements
    );

    //Create link from user to ingredient
    statements = createIngredientUserRelationships(
        params.user, params.name, params.amount, params.measurement, params.location, ingredientParameters, statements
    );

    return axios.post(config.url, {
        "statements": statements,
    });
}

/**
 * Create nodes and relationships between user and recipes
 * @param params
 * @returns {Promise<AxiosResponse<T>>}
 */
async function createRecipeNodes(params) {
    //Convert parameters to useful arrays
    var ingredients = JSON.parse(params.ingredients);

    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    statements = createUser(params.user, statements);

    //Create recipe
    statements = createRecipe(params, statements);

    //Create link from user to recipe
    statements = createRecipeUserRelationships(params.user, params.name, statements);

    //Create links from recipe to ingredients
    for (var i = 0; i < ingredients.length; i++) {
        if (ingredients[i] != null) {
            var ingredientParameters = await fetchIngredientInfo(ingredients[i]["name"], ingredients[i]["amount"], ingredients[i]["measurement"]);
            //Double check ingredient created
            statements = createIngredient(ingredients[i]["name"], ingredientParameters, statements);
            statements = createIngredientUserRelationships(
                params.user, ingredients[i]["name"], 0, ingredients[i]["measurement"], '', ingredientParameters, statements
            );

            //Add links to recipe
            statements = createIngredientRecipeRelationships(
                ingredients[i]["name"], ingredients[i]["amount"], ingredients[i]["measurement"], params.name, ingredientParameters, statements
            );
        }
    }
    return axios.post(config.url, {
        "statements": statements,
    });
}

/**
 * Create nodes and relationships between user and recipes from Spoonacular algorithm
 * @param recipes
 * @returns {Promise<AxiosResponse<T>>}
 */
async function createRecipeNodesBulk(recipes) {
    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    statements = createUser(recipes[0].user, statements);

    //For each recipe fetched from spoonacular
    for (var i = 0; i < recipes.length; i++) {
        var ingredients = JSON.parse(recipes[i]['ingredients']);
        if (recipes[i]['cookTime'] == null || recipes[i]['prepTime'] == null) {
            continue;
        }
        var ingredientParametersList = [];
        //Add ingredients if not already in database
        for (var j = 0; j < ingredients.length; j++) {
            var ingredientParameters = await fetchIngredientInfo(ingredients[j].name, ingredients[j].amount, ingredients[j].measurement);
            ingredientParametersList.push(ingredientParameters);
            statements = createIngredient(ingredients[j]["name"], ingredientParameters, statements);
        }

        //Create recipe
        statements = createRecipe(recipes[i], statements);
        statements = createRecipeUserRelationships(recipes[0].user, recipes[i].name, statements);

        //Create links from recipe to ingredients
        for (var k = 0; k < ingredients.length; k++) {
            statements = createIngredientRecipeRelationships(ingredients[k]["name"], ingredients[k]["amount"],
                ingredients[k]["measurement"], recipes[i].name, ingredientParametersList[k], statements);
        }
    }
    return axios.post(config.url, {
        "statements": statements,
    });
}

function createRecipeUserLink(params, userIngredients) {
    var ingredients = JSON.parse(params.ingredients);
    var statements = [];
    statements = createUser(params.user, statements);
    statements = createRecipeUserRelationships(params.user, params.recipe, statements);

    var found = false;
    //Create link from user to ingredients
    for (var i = 0; i < ingredients.length; i++) {
        found = false;
        if (userIngredients == null) {
            statements = createIngredientUserRelationships(params.user, ingredients[i][0]["name"], 0, ingredients[i][1]["measurement"], "", {'price': 0}, statements);
        } else {
            for (var j = 0; j < userIngredients.length; j++) {
                if (ingredients[i][0]["name"] === userIngredients.data[j].row[0].name) {
                    found = true;
                }
            }
            if (found === false) {
                statements = createIngredientUserRelationships(params.user, ingredients[i][0]["name"], 0, ingredients[i][1]["measurement"], "", {'price': 0}, statements);
            }
        }
    }

    return axios.post(config.url, {
        "statements": statements,
    });
}

/**
 * Create a statement to create user nodes
 * @param user
 * @param statements
 * @returns {*}
 */
function createUser(user, statements) {
    statements.push({
        "statement": "MERGE (n:User {name:$name}) RETURN n",
        "parameters": {
            "name": user,
        }
    });
    return statements;
}

/**
 * Create a statement to create ingredient nodes
 * @param ingredient
 * @param parameters
 * @param statements
 * @returns {*}
 */
function createIngredient(ingredient, parameters, statements) {
    statements.push({
        "statement": "MERGE (n:Ingredient {name:$name, dietLabels:$dietLabels,healthLabels:$healthLabels}) RETURN n",
        "parameters": {
            'name': ingredient.toLowerCase(),
            'dietLabels': parameters.dietLabels,
            'healthLabels': parameters.healthLabels
        }
    });
    return statements;
}

/**
 * Create statements for creating relationships between ingredient and user nodes
 * @param user
 * @param ingredient
 * @param amount
 * @param measurement
 * @param location
 * @param parameters
 * @param statements
 * @returns {*}
 */
function createIngredientUserRelationships(user, ingredient, amount, measurement, location, parameters, statements) {
    //If the ingredient is part of the recipe that the user does not already store
    if (location === "" && amount === 0) {
        statements.push({
            "statement": "MATCH (u:User),(i:Ingredient) WHERE u.name=$user and i.name=$ingredient " +
                "MERGE(u)- [r: has] -> (i) set r.amount = COALESCE(r.amount,0) + $amount, r.measurement=$measurement, r.location=$location, r.price=$price " +
                "RETURN u, i",
            "parameters": {
                "user": user,
                "ingredient": ingredient.toLowerCase(),
                "amount": parseInt(amount),
                "measurement": measurement,
                "price": parameters.price,
                "location": location,
            }
        });
    } else {
        //Edit or update existing ingredient
        statements.push({
            "statement": "MATCH (u:User),(i:Ingredient) WHERE u.name=$user and i.name=$ingredient " +
                "MERGE(u)- [r: has] -> (i) set r.amount=$amount, r.measurement=$measurement, r.location=$location, r.price=$price " +
                "RETURN u, i",
            "parameters": {
                "user": user,
                "ingredient": ingredient.toLowerCase(),
                "amount": parseInt(amount),
                "measurement": measurement,
                "price": parameters.price,
                "location": location,
            }
        });
    }
    return statements;
}

/**
 * Creates statements for creating a recipe
 * @param params
 * @param statements
 * @returns {*}
 */
function createRecipe(params, statements) {
    if (params.tag == null) {
        params.tag = "Dinner";
    }
    statements.push({
        "statement": "MERGE (n:Recipe {name:$name,tag:$tag,servings:$servings,prepTime:$prepTime,cookTime:$cookTime,method:$method }) RETURN n",
        "parameters": {
            "name": params.name.toLowerCase(),
            "tag": params.tag,
            "servings": parseInt(params.servings),
            "prepTime": parseInt(params.prepTime),
            "cookTime": parseInt(params.cookTime),
            "method": params.methods
        }
    });
    return statements;
}

/**
 * Creates statements for creating a relationship between a recipe and a user.
 * @param user
 * @param recipe
 * @param statements
 * @returns {*}
 */
function createRecipeUserRelationships(user, recipe, statements) {
    statements.push({
        "statement": "MATCH (u:User),(re:Recipe) WHERE u.name=$user and re.name=$recipe MERGE(u)- [r: makes] -> (re) return u, re",
        "parameters": {
            "user": user,
            "recipe": recipe.toLowerCase(),
        }
    });
    return statements;
}

/**
 * Creates statements for the relationship between ingredients and recipes
 * @param ingredient
 * @param amount
 * @param measurement
 * @param recipe
 * @param parameters
 * @param statements
 * @returns {*}
 */
function createIngredientRecipeRelationships(ingredient, amount, measurement, recipe, parameters, statements) {
    statements.push({
        "statement": "MATCH (i:Ingredient),(re:Recipe) WHERE i.name=$ingredient and re.name=$recipe " +
            "MERGE(re)- [r: contains { amount: $amount, measurement: $measurement,weight:$weight, calories:$calories, " +
            "energy:$energy, fat:$fat, carbs:$carbs, protein:$protein, price:$price}] -> (i) " +
            "return i, re",
        "parameters": {
            "ingredient": ingredient.toLowerCase(),
            "recipe": recipe.toLowerCase(),
            "amount": parseInt(amount),
            "measurement": measurement,
            "price": parameters.price,
            "weight": parameters.weight,
            "calories": parameters.calories,
            "energy": parameters.energy,
            "fat": parameters.fat,
            "carbs": parameters.carbs,
            "protein": parameters.protein
        }
    });
    return statements;
}

/**
 * Returns ingredient nutrition, weight and price data
 * @param ingredient
 * @param amount
 * @param measurement
 * @returns {Promise<{dietLabels: *, healthLabels: *, price: *, name: *, weight: *, calories: *}>}
 */
async function fetchIngredientInfo(ingredient, amount, measurement) {
    var nutrition = await edamam.fetchNutritionalInfo(ingredient, amount, measurement);
    var tescoData = await tesco.fetchPriceData(ingredient, amount, measurement);
    tescoData = JSON.parse(tescoData);
    nutrition = nutrition.data;
    var ingredientParameters = {
        "name": ingredient,
        "calories": nutrition.calories,
        "weight": nutrition.totalWeight,
        "dietLabels": nutrition.dietLabels.toString(),
        "healthLabels": nutrition.healthLabels.toString(),
        "price": tescoData.uk.ghs.products.results[0].price,
    };

    //Nutrition data - these can be null so need to convert null to 0.
    ingredientParameters["energy"] = (nutrition.totalNutrients.ENERC_KCAL) ? nutrition.totalNutrients.ENERC_KCAL.quantity :0;
    ingredientParameters["fat"] = (nutrition.totalNutrients.FAT) ? nutrition.totalNutrients.FAT.quantity : 0;
    ingredientParameters["carbs"] = (nutrition.totalNutrients.CHOCDF) ? nutrition.totalNutrients.CHOCDF.quantity : 0;
    ingredientParameters["protein"] = (nutrition.totalNutrients.PROCNT) ? nutrition.totalNutrients.PROCNT.quantity : 0;

    return ingredientParameters;
}

module.exports.createIngredientNodes = createIngredientNodes;
module.exports.createRecipeNodes = createRecipeNodes;
module.exports.createRecipeNodesBulk = createRecipeNodesBulk;
module.exports.createRecipeUserLink = createRecipeUserLink;
module.exports.fetchIngredientInfo = fetchIngredientInfo;
module.exports.createIngredient = createIngredient;
module.exports.createIngredientUserRelationships = createIngredientUserRelationships;
module.exports.createIngredientRecipeRelationships = createIngredientRecipeRelationships;