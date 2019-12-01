const axios = require('axios').default;
const config = require("./example_config");

//Create nodes and relationships
function createNodesandRelationships(nodes, params) {
    console.log(nodes);
    var user = nodes[0].data[0];
    var ingredient = nodes[1].data[0];

    //Array of statements that will be sent in the axios request
    var statements = [];

    //Create user
    if (user == null) {
        statements.push({
            "statement": "CREATE (n:User) SET n.name=$name RETURN id(n)",
            "parameters": {
                "name": params.user,
            }
        });
    }

    //Create ingredient
    if (ingredient == null) {
        statements.push({
            "statement": "CREATE (n:Ingredient) SET n.name=$name RETURN id(n)",
            "parameters": {
                "name": params.name,
            }
        });
    }

    //Create link from user to ingredient
    statements.push({
        "statement": "MATCH (u:User),(i:Ingredient) WHERE u.name=$user and i.name=$ingredient CREATE(u)- [r: has { amount: $amount, type: $type, location: $location, sellByDate: $sellByDate }] -> (i) return u, i",
        "parameters": {
            "user": params.user,
            "ingredient": params.name,
            "amount": params.amount,
            "type": params.type,
            "sellByDate": params.sellByDate,
            "location": params.location,
        }
    });

    return axios.post(config.url, {
        "statements": statements,
    });
}

module.exports.createNodesandRelationships = createNodesandRelationships;