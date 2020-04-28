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

/**
 * Endpoint for getting ingredient details
 */
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
                        'measurement': data[i]['row'][1]['measurement'],
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

/**
 * Endpoint for creating ingredients
 */
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

/**
 * Endpoint for deleting ingredients
 */
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

/**
 * Endpoint for updating ingredients
 */
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

/**
 * Endpoint for updating ingredient amounts
 */
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


/**
 * Endpoint for getting recipe details
 */
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
                            'measurement': ingredients[j][1]['measurement'],
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

/**
 * Endpoint for creating recipes
 */
app.post("/recipe", function (req, res) {
    var parameters = req.body;
    //Create the nodes and relationships for the recipe if they do not already exist
    create.createRecipeNodes(parameters)
    //Get the response from createRecipeNodes
        .then(function (response) {
            var userResponse = response.data.results[0].data;
            var recipeResponse = response.data.results[1].data;
            if (userResponse && recipeResponse) {
                return res.send("SUCCESS New recipe node created for " +
                    userResponse[0].row[0]['name'] +
                    " which is " +
                    recipeResponse[0].row[0]['name']);
            } else {
                return res.send("ERROR creating recipe node " +
                    response.data.errors[0].code +
                    " " +
                    response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when creating recipe " + error)
            }
        });
});

/**
 * Endpoint for deleting recipes
 */
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

/**
 * Endpoint for updating recipe summary
 */
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

/**
 * Endpoint for updating recipe method
 */
app.patch("/recipe/method", function (req, res) {
    var parameters = req.body;
    //Unlink the recipe from the user - don't delete so it is still available in the search
    update.updateRecipeMethod(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            var userResponse = response.data.results[0].data[0].row[0];
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS recipe method updated for " + userResponse['name']);
            } else {
                res.send("Error when updating recipe method" + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when updating recipe method " + error)
            }
        });
});

/**
 * Endpoint for updating recipe ingredients
 */
app.patch("/recipe/ingredients", function (req, res) {
    var parameters = req.body;
    //Unlink the recipe from the user - don't delete so it is still available in the search
    update.updateRecipeIngredients(parameters)
    //Get the response from matchParameters
        .then(function (response) {
            var userResponse = response.data.results[0].data[0].row[0];
            if (response.data.results[0].data || response.data.results[1].data) {
                return res.send("SUCCESS recipe ingredients updated for " + userResponse['name']);
            } else {
                res.send("Error when updating recipe ingredients" + response.data.errors[0].code + " " + response.data.errors[0].message);
            }
        })
        .catch(function (error) {
            if (error) {
                res.send("Error when updating recipe ingredients " + error)
            }
        });
});

/**
 * Endpoint for getting details of next recipe in meal calendar
 */
app.get("/recipe/next", function (req, res) {
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
                        'measurement': ingredientResponse[1]['measurement'],
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

/**
 * Endpoint for getting search results for recipes
 */
app.get("/recipe/search", function (req, res) {
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

/**
 * Endpoint for creating a relationship between a recipe and a user
 */
app.post("/recipe/link", function (req, res) {
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


/**
 * Endpoint for getting a shopping list details
 */
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
                            'measurement': data[i]['row'][3],
                            'price': (data[i]['row'][4] - data[i]['row'][5]).toFixed(2)
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

/**
 * Endpoint for updating a shopping list
 */
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


/**
 * Endpoint for getting automated calendar results
 */
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

/**
 * Endpoint for pulling recipes into the application
 */
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

var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});
