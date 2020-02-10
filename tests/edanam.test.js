const edanam = require('../apis/edanam');

test('edanam fetch with type grams', async () => {
    var nutrition = await edanam.fetchNutritionalInfo("chopped tomatoes", 400, "grams");
    expect(nutrition.data['calories']).toBe(72);
    expect(nutrition.data['totalWeight']).toBe(400);
});

test('edanam fetch with type number', async () => {
    var nutrition = await edanam.fetchNutritionalInfo("pineapple", 1, "number");
    expect(nutrition.data['calories']).toBe(452);
    expect(nutrition.data['totalWeight']).toBe(905.0);
});