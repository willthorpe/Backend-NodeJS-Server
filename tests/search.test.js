const search = require('../algorithm/search');
const match = require('../database/matchRecord');
const axios = require('axios').default;
const config = require("../config");

beforeAll(() => {
    return axios.post(config.url, {
        "statements": [
            {
                "statement": "MATCH (n) DETACH DELETE n",
            },
            {
                "statement": "MERGE (n:User {name:$name}) RETURN n",
                "parameters": {
                    "name": "admin",
                }
            },
            {
                "statement": "MERGE (n:Ingredient {name:$name, dietLabels:$dietLabels,healthLabels:$healthLabels}) RETURN n",
                "parameters": {
                    'name': "Chicken Breast",
                    'dietLabels': "LOW_CARB",
                    'healthLabels': "SUGAR_CONSCIOUS, PEANUT_FREE, TREE_NUT_FREE, ALCOHOL_FREE, SULPHITE_FREE"
                }
            },
            {
                "statement": "MATCH (u:User),(i:Ingredient) WHERE u.name=$user and i.name=$ingredient CREATE(u)- [r: has { amount: $amount, measurement: $measurement, location: $location}] -> (i) return u, i",
                "parameters": {
                    "user": "admin",
                    "ingredient": "Chicken Breast",
                    "amount": 2,
                    "measurement": "number",
                    "location": "Fridge",
                }
            },
            {
                "statement": "MERGE (n:Recipe {name:$name,tag:$tag,servings:$servings,prepTime:$prepTime,cookTime:$cookTime,method:$method }) RETURN n",
                "parameters": {
                    "name": "Just Chicken",
                    "tag": "Main Meal",
                    "servings": 2,
                    "prepTime": 10,
                    "cookTime": 20,
                    "method": '["Cook chicken"]'
                }
            },
            {
                "statement": "MATCH (u:User),(re:Recipe) WHERE u.name=$user and re.name=$recipe CREATE(u)- [r: makes] -> (re) return u, re",
                "parameters": {
                    "user": "admin",
                    "recipe": "Just Chicken",
                }
            },
            {
                "statement": "MATCH (i:Ingredient),(re:Recipe) WHERE i.name=$ingredient and re.name=$recipe CREATE(re)- [r: contains { amount: $amount, measurement: $measurement,weight:$weight, calories:$calories, energy:$energy, fat:$fat, carbs:$carbs, protein:$protein}] -> (i) return i, re",
                "parameters": {
                    "ingredient": "Chicken Breast",
                    "recipe": "Just Chicken",
                    "amount": 1,
                    "measurement": "number",
                    "weight": 174.0,
                    "calories": 299,
                    "energy": 299.28,
                    "fat": 16.095,
                    "carbs": 0,
                    "protein": 36.279
                }
            }
        ]
    });
});


test('recipe search', async () => {
    var recipeResponse = await match.fetchSearchRecipes('User');
    var recipes = recipeResponse.data.results;
    var ingredientResponse = await match.fetchIngredients('admin');

    var parameters = {
        'search': '[0.9, 0.5, 0.3, 0.7, 0.1, 0.3, 0.8, 1]',
        'diets': '["LOW_CARB"]',
        'allergies': '[]',
    };
    var searchResults = search.searchRecipe(ingredientResponse.data.results[0], recipes, JSON.parse(parameters.search), JSON.parse(parameters.diets), JSON.parse(parameters.allergies));
    expect(searchResults[0]['score']).toBe(49);
});