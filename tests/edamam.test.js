const edamam = require('../apis/edamam');

test('edamam fetch with type grams', async () => {
    var nutrition = await edamam.fetchNutritionalInfo("chopped tomatoes", 400, "grams");
    expect(nutrition.data['calories']).toBe(72);
    expect(nutrition.data['totalWeight']).toBe(400);
});

test('edamam fetch with type number', async () => {
    var nutrition = await edamam.fetchNutritionalInfo("pineapple", 1, "number");
    expect(nutrition.data['calories']).toBe(452);
    expect(nutrition.data['totalWeight']).toBe(905.0);
});