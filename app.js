var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const match = require("./commands/matchRecord");
const create = require("./commands/createRecord");
const fetch = require("./commands/fetchRecords");

app.post("/ingredient", function (req, res) {
      //Check if the user and ingredient already exists in the app
    match.matchIngredient(req.query)
        //Get the response from matchParameters
        .then(function (makeResponse) {
            if (makeResponse.data.results[0].data || makeResponse.data.results[1].data) {
                //Create the nodes and the relationships
                return create.createIngredientRelationships(makeResponse.data.results, req.query);
            }
        })
        //Get the response from createNodesandRelationships
        .then(function (createResponse) {
            if (createResponse.data.results.data) {
                return res.send("SUCCESS");
            } else {
                return res.send("ERROR");
            }
        });
});

app.post("/recipe", function (req, res) {
    //Check if the user and recipe already exists in the app
    match.matchRecipe(req.query)
        //Get the response from matchParameters
        .then(function (makeResponse) {
            if (makeResponse.data.results[0].data || makeResponse.data.results[1].data) {
                //Create the nodes and the relationships
                return create.createRecipeRelationships(makeResponse.data.results, req.query);
            }
        })
        //Get the response from createNodesandRelationships
        .then(function (createResponse) {
            if (createResponse.data.results.data) {
                return res.send("SUCCESS");
            } else {
                return res.send("ERROR");
            }
        });
});

app.get("/ingredient", function (req, res) {
    //Fetch the ingredients for the user
    fetch.fetchIngredients(req.query.user)
        .then(function (response) {
            var data = response.data.results[0].data;
            if (data) {
                var responseData = [];
                for (var i = 0; i < data.length; i++) {
                    //Create new array for the output combining the responses
                    responseData.push({
                        'name': data[i]['row'][0]['name'],
                        'amount': data[i]['row'][1]['amount'],
                        'type' : data[i]['row'][1]['type'],
                        'location': data[i]['row'][1]['location'],
                        'sellByDate' : data[i]['row'][1]['sellByDate']
                    });
                }
                return res.send(responseData);
            } else {
                return res.send("ERROR");
            }
        });
});

app.get("/recipe", function (req, res) {
    //Fetch the recipes for the user
    var responseData = [];

    fetch.fetchRecipes(req.query.user)
        .then(function (response) {
            var data = response.data.results[0].data;
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    //Create new array for the output combining the recipe responses
                    responseData.push({
                        'name': data[i]['row'][0]['name'],
                        'tag': data[i]['row'][0]['tag'],
                        'servings': data[i]['row'][0]['servings'],
                        'prepTime': data[i]['row'][0]['prepTime'],
                        'cookTime': data[i]['row'][0]['cookTime'],
                        'method': data[i]['row'][0]['method'],
                        'ingredients': [],
                    });
                }
                return fetch.fetchRecipeIngredients(req.query.user)
                    .then(function (ingredientResponse) {
                        var data = ingredientResponse.data.results[0].data;
                        if (data) {
                            for (var i = 0; i < data.length; i++) {
                                var index = responseData.findIndex(x => x.name === data[i]['row'][0]['name'])
                                //Push ingredients to the output array
                                responseData[index]['ingredients'].push({
                                    'name': data[i]['row'][1]['name'],
                                    'amount': data[i]['row'][2]['amount'],
                                    'type': data[i]['row'][2]['type']
                                })
                            }
                            return res.send(responseData);
                        } else {
                            return res.send("INGREDIENT ERROR")
                        }
                    });
            } else {
                return res.send("RECIPE ERROR");
            }
        });
});

var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});