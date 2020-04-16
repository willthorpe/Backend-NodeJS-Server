const fetch = require('../database/fetchRecord');
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
                "statement": "MATCH (u:User),(i:Ingredient) WHERE u.name=$user and i.name=$ingredient CREATE(u)- [r: has { amount: $amount, type: $type, location: $location}] -> (i) return u, i",
                "parameters": {
                    "user": "admin",
                    "ingredient": "Chicken Breast",
                    "amount": 2,
                    "type": "number",
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
                "statement": "MATCH (i:Ingredient),(re:Recipe) WHERE i.name=$ingredient and re.name=$recipe CREATE(re)- [r: contains { amount: $amount, type: $type,weight:$weight, calories:$calories, energy:$energy, fat:$fat, carbs:$carbs, protein:$protein}] -> (i) return i, re",
                "parameters": {
                    "ingredient": "Chicken Breast",
                    "recipe": "Just Chicken",
                    "amount": 1,
                    "type": "number",
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
})

test('fetch ingredients for user', async () => {
    var response = await fetch.fetchIngredients('admin');
    var data = response.data.results[0].data;
    var responseData = [{
        'name': data[0]['row'][0]['name'],
        'amount': data[0]['row'][1]['amount'],
        'type': data[0]['row'][1]['type'],
        'location': data[0]['row'][1]['location'],
    }];
    expect(responseData[0]['name']).toBe('Chicken Breast');
    expect(responseData[0]['amount']).toBe(2);
    expect(responseData[0]['type']).toBe('number');
    expect(responseData[0]['location']).toBe('Fridge');
});

test('fetch recipes for user', async () => {
    var response = await fetch.fetchRecipes('admin');
    var data = response.data.results[0].data;
    var responseData = [{
        'recipeName': data[0]['row'][0]['name'],
        'servings': data[0]['row'][0]['servings'],
        'name': data[0]['row'][1][0][0]['name'],
        'amount': data[0]['row'][1][0][1]['amount'],
        'type': data[0]['row'][1][0][1]['type'],
    }];
    expect(responseData[0]['recipeName']).toBe('Just Chicken');
    expect(responseData[0]['servings']).toBe(2);
    expect(responseData[0]['name']).toBe('Chicken Breast');
    expect(responseData[0]['amount']).toBe(1);
    expect(responseData[0]['type']).toBe('number');
});

test('fetch recipe just chicken', async () => {
    var response = await fetch.fetchRecipe('Just Chicken');
    var data = response.data.results[0].data;
    var responseData = [{
        'recipeName': data[0]['row'][0]['name'],
        'servings': data[0]['row'][0]['servings'],
        'name': data[0]['row'][2]['name'],
        'amount': data[0]['row'][1]['amount'],
        'type': data[0]['row'][1]['type'],
    }];
    expect(responseData[0]['recipeName']).toBe('Just Chicken');
    expect(responseData[0]['servings']).toBe(2);
    expect(responseData[0]['name']).toBe('Chicken Breast');
    expect(responseData[0]['amount']).toBe(1);
    expect(responseData[0]['type']).toBe('number');
});

test('fetch shopping list', async () => {
    var parameters = {
        'user': "admin",
        'calendar': '[{"id": 1, "breakfast": ["Just Chicken","Just Chicken","Just Chicken","Just Chicken","Just Chicken","Just Chicken"], "lunch":[], "dinner":[]}]'
    }
    var response = await fetch.fetchShoppingList(parameters);
    var data = response.data.results[0].data;
    var responseData = [{
        'name': data[0]['row'][0]['name'],
        'amount': data[0]['row'][1] - data[0]['row'][2],
        'type': data[0]['row'][3],
    }];
    expect(responseData[0]['name']).toBe('Chicken Breast');
    expect(responseData[0]['amount']).toBe(4);
    expect(responseData[0]['type']).toBe('number');
});