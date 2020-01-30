var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const match = require("./database/matchRecord");
const create = require("./database/createRecord");
const fetch = require("./database/fetchRecord");
const update = require("./database/updateRecord");
const unlink = require("./database/unlinkRecord");

const edanam = require("./apis/edanam");

app.post("/ingredient", function (req, res) {
    //Check if the user and ingredient already exists in the app
    var user = null;
    var ingredient = null;
    var parameters = req.body;
    match.matchIngredient(parameters)
    //Get the response from matchParameters
        .then(function (makeResponse) {
            if (makeResponse.data.results.length == 2) {
                user = makeResponse.data.results[0].data[0];
                ingredient = makeResponse.data.results[1].data[0];
            }
                //Get nutritional data for ingredient
		console.log(parameters);
                return edanam.fetchNutritionalInfo(parameters.name, parameters.type);
        }).then(function (nutritionResponse) {
        //Create the nodes and the relationships
        return create.createIngredientRelationships(user, ingredient, parameters, nutritionResponse.data);
    })
    //Get the response from createNodesandRelationships
        .then(function (createResponse) {
            if (createResponse.data.results[0].data) {
                console.log(createResponse.data.errors[0]);
                return res.send("SUCCESS New ingredient node created " + createResponse.data.results[0].data[0].row[0]['name']);
            } else {
                return res.send("ERROR creating ingredient node " + createResponse.data.errors[0].code + " " + createResponse.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when creating ingredient " + error)
            }
        });
});

app.post("/recipe", function (req, res) {
    var parameters = req.body;
    //Check if the user and recipe already exists in the app
    match.matchRecipe(parameters)
    //Get the response from matchParameters
        .then(function (makeResponse) {
            if (makeResponse.data.results[0].data || makeResponse.data.results[1].data) {
                //Create the nodes and the relationships
                return create.createRecipeRelationships(makeResponse.data.results, parameters);
            } else {
                res.send("Error when matching recipe and user" + makeResponse.data.errors[0].code + " " + makeResponse.data.errors[0].message);
            }
        })
        //Get the response from createNodesandRelationships
        .then(function (createResponse) {
            if (createResponse.data.results[0].data) {
                return res.send("SUCCESS New recipe node created " + createResponse.data.results[0].data[0].row[0]['name']);
            } else {
                return res.send("ERROR creating recipe node " + createResponse.data.errors[0].code + " " + createResponse.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when creating recipe " + error)
            }
        });
});

app.patch("/list", function (req, res) {
    var parameters = req.body;
    update.updateShoppingList(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS Shopping list updated " + response.data.results[0].data[0].row[0]['name']);
            } else {
                res.send("Error when updating shopping list" + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when updating shopping list " + error)
            }
        });
});

app.get("/ingredient/:user", function (req, res) {
    var parameters = req.params;
    console.log("hello");
    console.log(parameters);
    //Fetch the ingredients for the user
    fetch.fetchIngredients(parameters.user)
        .then(function (response) {
	    console.log(response);
            var data = response.data.results[0].data;
            if (data) {
                var responseData = [];
                for (var i = 0; i < data.length; i++) {
                    //Create new array for the output combining the responses
                    responseData.push({
                        'name': data[i]['row'][0]['name'],
                        'amount': data[i]['row'][1]['amount'],
                        'type': data[i]['row'][1]['type'],
                        'location': data[i]['row'][1]['location'],
                        'useByDate': data[i]['row'][1]['useByDate']
                    });
		    console.log(responseData);
                }
                return res.send(responseData);
            } else {
                return res.send("ERROR when fetching ingredient node " + createResponse.data.errors[0].code + " " + createResponse.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when fetching ingredient " + error)
            }
        });
});

app.get("/recipe/:user", function (req, res) {
    //Fetch the recipes for the user
    var responseData = [];
    var parameters = req.params;

    fetch.fetchRecipes(parameters.user)
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
                        'method': JSON.parse(data[i]['row'][0]['method']),
                        'ingredients': [],
                    });
                }
                return fetch.fetchRecipeIngredients(parameters.user)
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
                            return res.send("ERROR when fetching recipe node " + createResponse.data.errors[0].code + " " + createResponse.data.errors[0].message);
                        }
                    });
            } else {
                return res.send("ERROR when fetching recipe node " + createResponse.data.errors[0].code + " " + createResponse.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when fetching recipe " + error)
            }
        });
});

app.get("/list/:user/:calendar", function (req, res) {
    var parameters = req.params;
    //Fetch the shopping list for the user
    fetch.fetchShoppingList(parameters)
        .then(function (response) {
            var data = response.data.results[0].data;
            if (data) {
                var responseData = [];
                for (var i = 0; i < data.length; i++) {
                    //Create new array for the output combining the response
                    var amount = data[i]['row'][1] - data[i]['row'][2];
                    if (amount > 0) {
                        responseData.push({
                            'name': data[i]['row'][0]['name'],
                            'amount': amount,
                            'type': data[i]['row'][3]
                        });
                    }
                }
                return res.send(responseData);
            } else {
                return res.send("ERROR when fetching list node " + createResponse.data.errors[0].code + " " + createResponse.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when fetching shopping list " + error)
            }
        });
});

app.patch("/recipe/:user/:search", function (req, res) {
    var parameters = req.params;
    //Check if the user and recipe already exists in the app
    unlink.deleteRecipe(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS Recipe deleted for " + response.data.results[0].data[0].row[0]['name']);
            } else {
                res.send("Error when deleting recipe" + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when deleting recipe " + error)
            }
        });
});

var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});
