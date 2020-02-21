const create = require('../database/createRecord');

test('edamam pull nutrition in create record', async () => {
    var ingredientParameters = await create.fetchNutrition("pineapple", 1, "number");
    expect(ingredientParameters["energy"]).toBe(452.50000000000006);
    expect(ingredientParameters["fat"]).toBe(1.086);
    expect(ingredientParameters["carbs"]).toBe(118.736);
    expect(ingredientParameters["protein"]).toBe(4.8870000000000005);
    expect(ingredientParameters["calories"]).toBe(452);
});

test('create new ingredient', async () => {
    parameters = {
        'user' : 'User',
        'name' : 'Noodles',
        'type' : 'grams',
        'amount' : 600,
        'location' : 'cupboard',
        'useByDate' : '20200210'
    };

    var ingredientResponse = await create.createIngredientRelationships(parameters);
    expect(ingredientResponse.data.results[0].data[0].row[0]['name']).toBe('User');
    expect(ingredientResponse.data.results[1].data[0].row[0]['name']).toBe('Noodles');
});

test('create new recipe', async () => {
    parameters = {
        'user': 'User',
        'name': 'Literally Noodles',
        'servings': 4,
        'cookTime': 15,
        'prepTime' : 10,
        'tag': 'Dinner',
        'methods': '["Boil pasta"]',
        'ingredients': '[{ "name": "Noodles", "amount": 300, "type": "grams" }]'
    };

    var recipeResponse = await create.createRecipeRelationships(parameters);
    expect(recipeResponse.data.results[0].data[0].row[0]['name']).toBe('User');
    expect(recipeResponse.data.results[1].data[0].row[0]['name']).toBe('Literally Noodles');
});