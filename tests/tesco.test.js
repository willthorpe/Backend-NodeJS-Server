const tesco = require('../api/tesco');

test('tesco fetch with measurement grams', async () => {
    var tescoData = await tesco.fetchPriceData("chopped tomatoes", 400, "grams");
    tescoData = JSON.parse(tescoData);
    expect(tescoData.uk.ghs.products.results[0].price).toBe(0.8);
});

test('tesco fetch with measurement number', async () => {
    var tescoData = await tesco.fetchPriceData("pineapple", 1, "number");
    tescoData = JSON.parse(tescoData);
    expect(tescoData.uk.ghs.products.results[0].price).toBe(0.85);
});