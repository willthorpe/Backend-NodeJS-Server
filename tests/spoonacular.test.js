const spoonacular = require('../api/spoonacular');

test('spoonacular pull 1 main course', async () => {
    var response = await spoonacular.pullRecipes(1);
    expect(response.data.recipes.length).toBe(1);
    expect(response.data.recipes[0]['dishTypes']).toContain("main course");
});

test('spoonacular format test', async () => {
    var recipeResponse = await spoonacular.pullRecipes(1);
    var recipeList = recipeResponse.data.recipes;
    var response = await spoonacular.formatRecipes(1, recipeList);
    expect(response[0]['name'] = recipeList[0]['title']);
    expect(response[0]['servings'] = recipeList[0]['servings']);
    expect(response[0]['prepTime'] = recipeList[0]['preparationMinutes']);
    expect(response[0]['cookTime'] = recipeList[0]['cookingMinutes']);
    expect(response[0]['user'] = 'admin');
    expect(response[0]['ingredients'][0]['name'] = recipeList[0]['extendedIngredients'][0]['name']);
    expect(response[0]['methods'][0] = recipeList[0]['analyzedInstructions'][0]['steps'][0]['step']);
});