const create = require('../database/createRecord');

test('edanam pull nutrition in create record', async () => {
    var ingredientParameters = await create.fetchNutrition("pineapple", 1, "number");
    expect(ingredientParameters["energy"]).toBe(452.50000000000006);
    expect(ingredientParameters["fat"]).toBe(1.086);
    expect(ingredientParameters["carbs"]).toBe(118.736);
    expect(ingredientParameters["protein"]).toBe(4.8870000000000005);
    expect(ingredientParameters["calories"]).toBe(452);
});
