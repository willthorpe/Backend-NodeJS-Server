var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const match = require("./commands/matchRecord");
const create = require("./commands/createRecord");

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

var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});