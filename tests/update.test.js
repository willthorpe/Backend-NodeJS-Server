const update = require('../database/updateRecord');
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
                "statement": "MERGE (n:Ingredient {name:$name, dietLabel:$dietLabels,healthLabels:$healthLabels}) RETURN n",
                "parameters": {
                    'name': "Chicken Breast",
                    'dietLabels': "LOW_CARB",
                    'healthLabels': "SUGAR_CONSCIOUS, PEANUT_FREE, TREE_NUT_FREE, ALCOHOL_FREE, SULPHITE_FREE"
                }
            },
            {
                "statement": "MATCH (u:User),(i:Ingredient) WHERE u.name=$user and i.name=$ingredient CREATE(u)- [r: has { amount: $amount, type: $type, location: $location, useByDate: $useByDate}] -> (i) return u, i",
                "parameters": {
                    "user": "admin",
                    "ingredient": "Chicken Breast",
                    "amount": 2,
                    "type": "number",
                    "useByDate": "19022020",
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
                    "method": "[Cook chicken]"
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
});


test('update shopping list', async () => {
    var parameters = {
        'user': 'admin',
        'purchased': '[{"name":"Chicken Breast","amount":10,"type":"number"}]'
    };

    var updated = await update.updateShoppingList(parameters);
    expect(updated.data.errors).toHaveLength(0);
    expect(updated.data.results[0].data[0].row[0]['amount']).toBe(12);
});

test('update ingredients', async () => {
    var parameters = {
        'user': 'admin',
        'purchased': '[{"name":"Chicken Breast","amount":5,"type":"number"}]'
    };

    var updated = await update.updateIngredients(parameters);
    expect(updated.data.errors).toHaveLength(0);
    expect(updated.data.results[0].data[0].row[0]['amount']).toBe(7);
});