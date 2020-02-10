const spoontacular = require('../apis/spoontacular');

test('spoontacular pull 1 main course', async () => {
    var response = await spoontacular.pullRecipes(1);
    expect(response.data.recipes.length).toBe(1);
    expect(response.data.recipes[0]['dishTypes']).toContain("main course");
});