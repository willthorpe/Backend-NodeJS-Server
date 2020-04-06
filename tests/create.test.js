const create = require('../database/createRecord');
const spoonacular = require('../api/spoonacular');

test('edamam pull nutrition in create record', async () => {
    var ingredientParameters = await create.fetchNutrition("pineapple", 1, "number");
    expect(ingredientParameters["energy"]).toBe(452.50000000000006);
    expect(ingredientParameters["fat"]).toBe(1.086);
    expect(ingredientParameters["carbs"]).toBe(118.736);
    expect(ingredientParameters["protein"]).toBe(4.8870000000000005);
    expect(ingredientParameters["calories"]).toBe(452);
});

test('create new ingredient', async () => {
    var parameters = {
        'user' : 'User',
        'name' : 'Noodles',
        'type' : 'grams',
        'amount' : 600,
        'location' : 'cupboard',
        'useByDate' : '20200210'
    };

    var ingredientResponse = await create.createIngredientNodes(parameters);
    expect(ingredientResponse.data.results[0].data[0].row[0]['name']).toBe('User');
    expect(ingredientResponse.data.results[1].data[0].row[0]['name']).toBe('Noodles');
});

test('create new recipe', async () => {
    var parameters = {
        'user': 'User',
        'name': 'Literally Noodles',
        'servings': 4,
        'cookTime': 15,
        'prepTime' : 10,
        'tag': 'Dinner',
        'methods': '["Boil pasta"]',
        'ingredients': '[{ "name": "Noodles", "amount": 300, "type": "grams" }]'
    };

    var recipeResponse = await create.createRecipeNodes(parameters);
    expect(recipeResponse.data.results[0].data[0].row[0]['name']).toBe('User');
    expect(recipeResponse.data.results[1].data[0].row[0]['name']).toBe('Literally Noodles');
});

test('bulk create recipes', async () => {
    var recipeResponse = await spoonacular.pullRecipes(1);
    var recipeList = recipeResponse.data.recipes;
    var response = await spoonacular.formatRecipes(1, recipeList);
    var createResponse = await create.createRecipeNodesBulk(response);
    var recipes = createResponse.data.results[0].data[0];
    expect(recipes[0]['name']).toBeDefined();
    expect(recipes[0]['servings']).toBeDefined();
    expect(recipes[0]['cookTime']).toBeDefined();
    expect(recipes[0]['prepTime']).toBeDefined();
});