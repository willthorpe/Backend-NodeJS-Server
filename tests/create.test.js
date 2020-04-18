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
    };

    var ingredientResponse = await create.createIngredientNodes(parameters);
    expect(ingredientResponse.data.results[0].data[0].row[0]['name']).toBe('User');
    expect(ingredientResponse.data.results[1].data[0].row[0]['name']).toBe('noodles');
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
    expect(recipeResponse.data.results[1].data[0].row[0]['name']).toBe('literally noodles');
});

test('bulk create recipes', async () => {
    var parameters = [{ 'name': 'Pan Seared Lamb Loin With Chimichurri & Roasted Trio Squash Salad With Goat Cheese and Pinenuts',
        servings: 4,
        prepTime: 10,
        cookTime: 35,
        ingredients: '[{"name":"extra virgin olive oil","amount":2,"type":"Tbsps"},{"name":"flat leaf parsley","amount":59.147,"type":"milliliters"},{"name":"garlic clove","amount":1,"type":""},{"name":"ground pepper","amount":4,"type":"servings"},{"name":"kosher salt","amount":4,"type":"servings"},{"name":"lamb loin chops","amount":4,"type":""},{"name":"lemon","amount":1,"type":""},{"name":"mint","amount":59.147,"type":"milliliters"},{"name":"pinenuts","amount":59.147,"type":"milliliters"},{"name":"red pepper flakes","amount":1,"type":"Tbsp"},{"name":"shallot","amount":1,"type":""}]',
        methods: '["Preheat oven to 400F.For the Chimichurri, place all of the ingredients in a large bowl and incorporate together.  Season with salt and pepper.","Heat a large, heavy bottomed pan with the oil. Sprinkle  each side of the lamb loin evenly with salt and pepper.  (This cooking process is exactly like the way you make steak).  Once the oil is hot (it will smoke a little bit), sear the lamb loin, about 2 minutes per side and allow the lamb to cook the rest of the way in the oven. The cooking times are as follows:If you like your lamb rare, place it in the oven for no more than 2-3 minutes.  If you like your lamb medium rare place it in the oven for about 6-8 minutes.  If you like your lamb medium place it in the oven for 9 to 11 minutes. If you like it well done leave it in there for 12-14 minutes.  Remember, the lamb will continue to cook after you take it out so plan accordingly."]',
        user: 'admin' }];

    var createResponse = await create.createRecipeNodesBulk(parameters);
    var recipes = createResponse.data.results;
    expect(recipes[recipes.length - 1].data[0].row[1]['name']).toBeDefined();
    expect(recipes[recipes.length - 1].data[0].row[1]['cookTime']).toBeDefined();
    expect(recipes[recipes.length - 1].data[0].row[1]['prepTime']).toBeDefined();
    expect(recipes[recipes.length - 1].data[0].row[1]['servings']).toBeDefined();
});