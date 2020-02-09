var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const create = require("./database/createRecord");
const fetch = require("./database/fetchRecord");
const update = require("./database/updateRecord");
const unlink = require("./database/unlinkRecord");
const search = require("./database/searchRecord");

const spoontacular = require("./apis/spoontacular");

app.post("/ingredient", function (req, res) {
    var parameters = req.body;
    create.createIngredientRelationships(parameters)
    //Get the response from createNodesandRelationships
        .then(function (response) {
            if (response.data.results[0].data) {
                console.log(response.data.errors[0]);
                return res.send("SUCCESS New ingredient node created " + response.data.results[0].data[0].row[0]['name']);
            } else {
                return res.send("ERROR creating ingredient node " + response.data.errors[0].code + " " + response.data.errors[0].message);
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
    create.createRecipeRelationships(parameters)
        //Get the response from createNodesandRelationships
        .then(function (response) {
            if (response.data.results[0].data) {
                return res.send("SUCCESS New recipe node created " + response.data.results[0].data[0].row[0]['name']);
            } else {
                return res.send("ERROR creating recipe node " + response.data.errors[0].code + " " + response.data.errors[0].message);
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

app.get("/ingredient", function (req, res) {
    var parameters = req.query;
    console.log(parameters);    
    //Fetch the ingredients for the user
    fetch.fetchIngredients(parameters.user)
        .then(function (response) {
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

app.get("/nextRecipe", function (req, res) {
    var parameters = req.query;

    fetch.fetchRecipe(parameters.recipe)
        .then(function (response) {
            var responseData = {
                'name': response.data.results[0].data[0]['row'][0]['name'],
                'tag': response.data.results[0].data[0]['row'][0]['tag'],
                'servings': response.data.results[0].data[0]['row'][0]['servings'],
                'prepTime': response.data.results[0].data[0]['row'][0]['prepTime'],
                'cookTime': response.data.results[0].data[0]['row'][0]['cookTime'],
                'method': JSON.parse(response.data.results[0].data[0]['row'][0]['method']),
                'ingredients': [],
            };

            for (var i = 0; i < response.data.results[0].data.length; i++) {
                responseData.ingredients.push(
                    {
                        'name': response.data.results[0].data[i]['row'][2]['name'],
                        'amount': response.data.results[0].data[i]['row'][1]['amount'],
                        'type': response.data.results[0].data[i]['row'][1]['type'],
                        'weight': response.data.results[0].data[i]['row'][1]['weight'],
                        'calories': response.data.results[0].data[i]['row'][1]['calories'],
                        'energy': response.data.results[0].data[i]['row'][1]['energy'],
                        'fat': response.data.results[0].data[i]['row'][1]['fat'],
                        'carbs': response.data.results[0].data[i]['row'][1]['carbs'],
                        'protein': response.data.results[0].data[i]['row'][1]['protein']
                    }
                );
            }
            res.send(responseData);
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when fetching recipe " + error)
            }
        });
});

app.get("/recipe", function (req, res) {
    //Fetch the recipes for the user
    var responseData = [];
    var parameters = req.query;
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
                                    'type': data[i]['row'][2]['type'],
                                    "weight": data[i]['row'][2]['weight'],
                                    "calories": data[i]['row'][2]['calories'],
                                    "energy": data[i]['row'][2]['energy'],
                                    "fat": data[i]['row'][2]['fat'],
                                    "carbs": data[i]['row'][2]['carbs'],
                                    "protein": data[i]['row'][2]['protein'],
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

app.get("/list", function (req, res) {
    var parameters = req.query;
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

app.patch("/recipe", function (req, res) {
    var parameters = req.body;
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

app.get("/search", function (req, res) {
    var parameters = req.query;
    var recipes = []
    //Return results for the user query
    fetch.fetchAllRecipes()
        .then(function (fetchResponse) {
            recipes = fetchResponse.data.results;
            return fetch.fetchIngredients(parameters.user);
        }).then(function (ingredientResponse) {
            return search.searchRecipe(ingredientResponse.data.results[0], recipes, JSON.parse(parameters.search), JSON.parse(parameters.diets),JSON.parse(parameters.allergies))
        }).then(function (searchResponse) {
            if (searchResponse != null) {
                return res.send(searchResponse);
            } else {
                res.send("Error when searching recipe");
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when searching recipe " + error)
            }
        });
});

app.get("/pull", function (req, res) {
    var parameters = req.query;
    var formattedRecipes = [];
    //Check if the user and recipe already exists in the app
    spoontacular.pullRecipes(parameters.number)
        //Get the response from matchParameters
        .then(function (response) {
            return spoontacular.formatRecipes(parameters.number, response.data.recipes);
        })
        .then(function (formatResponse) {
            if (formatResponse !== []) {
                formattedRecipes = formatResponse;
                return create.createRecipeRelationshipsBulk(formattedRecipes)
                    //Get the response from createNodesandRelationships
                    .then(function (response) {
                        if (response.data.results[0].data) {
                            return res.send("SUCCESS New recipe node created " + response.data.results[0].data[0].row[0]['name']);
                        } else {
                            return res.send("ERROR creating recipe node " + response.data.errors[0].code + " " + createResponse.data.errors[0].message);
                        }
                    })
            } else {
                res.send("Error fetching recipes");
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when fetching recipes " + error)
            }
        });
});

var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});
