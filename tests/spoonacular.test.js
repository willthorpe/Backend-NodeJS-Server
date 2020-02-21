const spoonacular = require('../apis/spoonacular');

test('spoonacular pull 1 main course', async () => {
    var response = await spoonacular.pullRecipes(1);
    expect(response.data.recipes.length).toBe(1);
    expect(response.data.recipes[0]['dishTypes']).toContain("main course");
});