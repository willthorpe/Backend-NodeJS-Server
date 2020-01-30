const axios = require('axios').default;
const config = require("../example_config");

//Create nodes and relationships between user and ingredients
function createIngredientRelationships(user, ingredient, params, nutrition) {
    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    if (user == null) {
        statements.push({
            "statement": "CREATE (n:User) SET n.name=$name RETURN id(n)",
            "parameters": {
                "name": params.user,
            }
        });
    }

    //Create ingredient
    if (ingredient == null) {
        var ingredientParameters = {
            "name": params.name,
            "calories": nutrition.calories,
            "weight": nutrition.totalWeight,
            "dietLabels": nutrition.dietLabels.toString(),
            "healthLabels": nutrition.healthLabels.toString(),
            "energy": nutrition.totalNutrients.ENERC_KCAL.quantity,
        };
        if(nutrition.totalNutrients.FAT){
            ingredientParameters["fat"] = nutrition.totalNutrients.FAT.quantity;
        }else{
            ingredientParameters["fat"] = 0;
        }
        if(nutrition.totalNutrients.CHOCDF){
            ingredientParameters["carbs"] = nutrition.totalNutrients.CHOCDF.quantity;
        }else{
            ingredientParameters["carbs"] = 0;
        }
        if(nutrition.totalNutrients.PROCNT){
            ingredientParameters["protein"] = nutrition.totalNutrients.PROCNT.quantity;
        }else{
            ingredientParameters["protein"] = 0;
        }
        statements.push({
            "statement": "CREATE (n:Ingredient) SET n.name=$name, n.calories=$calories, n.weight=$weight,n.energy=$energy,n.fat=$fat,n.carbs=$carbs,n.protein=$protein, n.dietLabels=$dietLabels,n.healthLabels=$healthLabels RETURN id(n)",
            "parameters": ingredientParameters
        });
    }
    //Create link from user to ingredient
    statements.push({
        "statement": "MATCH (u:User),(i:Ingredient) WHERE u.name=$user and i.name=$ingredient CREATE(u)- [r: has { amount: $amount, type: $type, location: $location, useByDate: $useByDate }] -> (i) return u, i",
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
function createRecipeRelationships(nodes, params) {
    var user = nodes[0].data[0];
    var recipe = nodes[1].data[0];

    //Convert parameters to useful arrays
    var ingredients = JSON.parse(params.ingredients);

    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    if (user == null) {
        statements.push({
            "statement": "CREATE (n:User) SET n.name=$name RETURN id(n)",
            "parameters": {
                "name": params.user,
            }
        });
    }

    //Create recipe
    if (recipe == null) {
        statements.push({
            "statement": "CREATE (n:Recipe) SET n.name=$name,n.tag=$tag,n.servings=$servings,n.prepTime=$prepTime,n.cookTime=$cookTime,n.method=$method RETURN id(n)",
            "parameters": {
                "name": params.name,
                "tag": params.tag,
                "servings": params.servings,
                "prepTime": params.prepTime,
                "cookTime": params.cookTime,
                "method": params.methods
            }
        });
    }
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
            statements.push({
                "statement": "MATCH (i:Ingredient),(re:Recipe) WHERE i.name=$ingredient and re.name=$recipe CREATE(re)- [r: contains { amount: $amount, type: $type}] -> (i) return i, re",
                "parameters": {
                    "ingredient": ingredients[i]['name'],
                    "recipe": params.name,
                    "amount": ingredients[i]['amount'],
                    "type": ingredients[i]['type'],
                }
            });
        }
    }
    return axios.post(config.url, {
        "statements": statements,
    });
}

module.exports.createIngredientRelationships = createIngredientRelationships;
module.exports.createRecipeRelationships = createRecipeRelationships;