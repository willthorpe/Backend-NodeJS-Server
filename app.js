var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const create = require("./database/createRecord");
const fetch = require("./database/matchRecord");
const update = require("./database/updateRecord");
const unlink = require("./database/unlinkRecord");
const search = require("./algorithm/search");
const automate = require("./algorithm/automate");

const spoonacular = require("./api/spoonacular");

app.post("/ingredient", function (req, res) {
    var parameters = req.body;
    //Create ingredient and relationship nodes
    create.createIngredientNodes(parameters)
        .then(function (response) {
            var userResponse = response.data.results[0].data;
            var ingredientResponse = response.data.results[1].data;
            if (userResponse && ingredientResponse) {
                //If there are valid responses the front end will output saved
                return res.send(
                    "SUCCESS New ingredient node created for " +
                    userResponse[0].row[0]['name'] +
                    " which is " +
                    ingredientResponse[0].row[0]['name']
                );
            } else {
                return res.send("" +
                    "ERROR creating ingredient node " +
                    response.data.errors[0].code +
                    " " +
                    response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            //Return error to front end which then gets displayed
            if (error) {
                res.send("Error when creating ingredient " + error)
            }
        });
});

app.post("/recipe", function (req, res) {
    var parameters = req.body;
    //Check if the user and recipe already exists in the app
    create.createRecipeNodes(parameters)
    //Get the response from createNodesandRelationships
        .then(function (response) {
            var userResponse = response.data.results[0].data;
            var recipeResponse = response.data.results[1].data;
            if (userResponse && recipeResponse) {
                return res.send("SUCCESS New recipe node created for " + userResponse[0].row[0]['name'] + " which is " + recipeResponse[0].row[0]['name']);
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

app.post("/link", function (req, res) {
    var parameters = req.body;
    //Link recipe to the user
    fetch.fetchIngredients(parameters.user)
        .then(function (fetchResponse) {
            return create.createRecipeUserLink(parameters, fetchResponse.data.results.data);
        })
        //Get the response from creating the link
        .then(function (response) {
            var linkResponse = response.data.results[0].data;
            if (linkResponse) {
                return res.send("SUCCESS New link created for " + linkResponse[0].row[0]['name'] + " to " + linkResponse[1].row[0]['name']);
            } else {
                return res.send("ERROR creating link " + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when creating link " + error)
            }
        });
});

app.patch("/list", function (req, res) {
    var parameters = req.body;
    update.updateShoppingList(parameters)
    //Update the shopping list with bought amounts
        .then(function (response) {
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS Shopping list updated for " + response.data.results[0].data[0].row[0]['name']);
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
            var recipeResponse = response.data.results[0].data[0]['row'][0];
            var responseData = {
                'name': recipeResponse['name'],
                'tag': recipeResponse['tag'],
                'servings': recipeResponse['servings'],
                'prepTime': recipeResponse['prepTime'],
                'cookTime': recipeResponse['cookTime'],
                'method': JSON.parse(recipeResponse['method']),
                'ingredients': [],
            };

            for (var i = 0; i < response.data.results[0].data.length; i++) {
                var ingredientResponse = response.data.results[0].data[i]['row'];
                responseData.ingredients.push(
                    {
                        'name': ingredientResponse[2]['name'],
                        'amount': ingredientResponse[1]['amount'],
                        'type': ingredientResponse[1]['type'],
                        'weight': ingredientResponse[1]['weight'],
                        'calories': ingredientResponse[1]['calories'],
                        'energy': ingredientResponse[1]['energy'],
                        'fat': ingredientResponse[1]['fat'],
                        'carbs': ingredientResponse[1]['carbs'],
                        'protein': ingredientResponse[1]['protein']
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
                    var recipeResponse = data[i]['row'][0];
                    responseData.push({
                        'name': recipeResponse['name'],
                        'tag': recipeResponse['tag'],
                        'servings': recipeResponse['servings'],
                        'prepTime': recipeResponse['prepTime'],
                        'cookTime': recipeResponse['cookTime'],
                        'method': JSON.parse(recipeResponse['method']),
                        'ingredients': [],
                    });
                    var ingredients = data[i]['row'][1];
                    for (var j = 0; j < ingredients.length; j++) {
                        var index = responseData.findIndex(x => x.name === data[i]['row'][0]['name'])
                        //Push ingredients to the output array
                        responseData[index]['ingredients'].push({
                            'name': ingredients[j][0]['name'],
                            'amount': ingredients[j][1]['amount'],
                            'type': ingredients[j][1]['type'],
                            "weight": ingredients[j][1]['weight'],
                            "calories": ingredients[j][1]['calories'],
                            "energy": ingredients[j][1]['energy'],
                            "fat": ingredients[j][1]['fat'],
                            "carbs": ingredients[j][1]['carbs'],
                            "protein": ingredients[j][1]['protein'],
                        })
                    }
                }
                return res.send(responseData);
            } else {
                return res.send("ERROR when fetching recipe node " + response.data.errors[0].code + " " + response.data.errors[0].message);
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
                    //Take the amount you have away from the needed amount
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

app.delete("/ingredient", function (req, res) {
    var parameters = req.query;
    //Unlink the ingredient from the user - don't delete so it is still available in the search
    unlink.deleteIngredient(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            var userResponse = response.data.results[0].data[0].row[0];
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS Ingredient deleted for " + userResponse['name']);
            } else {
                res.send("Error when deleting ingredient" + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when deleting ingredient " + error)
            }
        });
});

app.delete("/recipe", function (req, res) {
    var parameters = req.query;
    //Unlink the recipe from the user - don't delete so it is still available in the search
    unlink.deleteRecipe(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            var userResponse = response.data.results[0].data[0].row[0];
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS Recipe deleted for " + userResponse['name']);
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

app.patch("/ingredient", function (req, res) {
    var parameters = req.body;
    //Update the ingredient
    update.updateIngredient(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            var userResponse = response.data.results[0].data[0].row[0];
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS ingredient  updated for " + userResponse['name']);
            } else {
                res.send("Error when updating ingredient " + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when updating ingredient  " + error)
            }
        });
});

app.patch("/ingredient/amount", function (req, res) {
    var parameters = req.body;
    //Update only the amount field for the ingredient
    update.updateIngredientAmounts(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            var userResponse = response.data.results[0].data[0].row[0];
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS ingredient amounts updated for " + userResponse['name']);
            } else {
                res.send("Error when updating ingredient amounts" + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when updating ingredient amounts " + error)
            }
        });
});

app.patch("/recipe/summary", function (req, res) {
    var parameters = req.body;
    //Unlink the recipe from the user - don't delete so it is still available in the search
    update.updateRecipeSummary(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            var userResponse = response.data.results[0].data[0].row[0];
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS recipe summary updated for " + userResponse['name']);
            } else {
                res.send("Error when updating recipe summary" + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when updating recipe summary " + error)
            }
        });
});

app.get("/search", function (req, res) {
    var parameters = req.query;
    var recipes = [];
    //Return results for the user query
    fetch.fetchAllRecipes(parameters.user)
        .then(function (fetchResponse) {
            recipes = fetchResponse.data.results;
            return fetch.fetchIngredients(parameters.user);
        }).then(function (ingredientResponse) {
        return search.searchRecipe(ingredientResponse.data.results[0], recipes, JSON.parse(parameters.search), JSON.parse(parameters.diets), JSON.parse(parameters.allergies))
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

app.get("/automate", function (req, res) {
    var parameters = req.query;
    console.log(parameters);
    //Return results for automating the calendar
    fetch.fetchRecipes(parameters.user)
        .then(function (response) {
            return automate.automateCalendar(parameters, response.data.results[0].data);
        })
        .then(function (automateResponse) {
            res.send(automateResponse);
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
    spoonacular.pullRecipes(parameters.number)
    //Get the response from matchParameters
        .then(function (response) {
            return spoonacular.formatRecipes(parameters.number, response.data.recipes);
        })
        .then(function (formatResponse) {
            if (formatResponse !== []) {
                formattedRecipes = formatResponse;
                return create.createRecipeNodesBulk(formattedRecipes)
                //Get the response from createNodesandRelationships
                    .then(function (response) {
                        if (response.data.results[0].data) {
                            return res.send("SUCCESS New recipe node created for admin");
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

app.get("/graph/recipe", function (req, res) {
    var parameters = req.query;
    fetch.fetchRecipeGraphData(parameters.user)
    //Update the shopping list with bought amounts
        .then(function (response) {
            if (response.data.results[0].data) {
                var recipes = response.data.results;
                var calendars = JSON.parse(parameters.calendars);
                var data = [];

                for (var recipe = 0; recipe < recipes[0].data.length; recipe++) {
                    data.push(
                        {
                            'recipe': recipes[0].data[recipe].row[0].name,
                            'amount': 0
                        })
                }

                for (var datum = 0; datum < data.length; datum++) {
                    for (var calendar = 0; calendar < calendars.length; calendar++) {
                        for (var i = 0; i < calendars[calendar].breakfast.length; i++) {
                            if (calendars[calendar].breakfast[i] === data[datum].recipe) {
                                data[datum].amount++;
                            }
                        }
                        for (var j = 0; j < calendars[calendar].lunch.length; j++) {
                            if (calendars[calendar].lunch[j] === data[datum].recipe) {
                                data[datum].amount++;
                            }
                        }
                        for (var k = 0; k < calendars[calendar].dinner.length; k++) {
                            if (calendars[calendar].dinner[k] === data[datum].recipe) {
                                data[datum].amount++;
                            }
                        }
                    }
                }
                return res.send(data);
            } else {
                res.send("Error when fetching recipe graph" + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when updating recipe graph " + error)
            }
        });
});

var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});
