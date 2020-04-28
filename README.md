# The serverside code for the meal planning app final year project

The server handles most of the computation for the app through its API that the frontend connects to.

### API Endpoints
* GET	   /ingredient          Get ingredient details
* POST   /ingredient	        Creating ingredients
* DELETE /ingredient	        Deleting ingredients
* PATCH  /ingredient	        Updating ingredients
* PATCH  /ingredient/amount	Updating ingredient amounts
* GET	   /recipe              Get recipe details
* POST   /recipe		        Creating recipes
* DELETE /recipe		        Deleting recipes
* PATCH  /recipe/summary	    Updating recipe summary
* PATCH  /recipe/method	    Updating recipe method
* PATCH  /recipe/ingredients	Updating ingredients in the recipe
* GET	   /recipe/next	        Get details of the next recipe in the meal calendar
* GET	   /recipe/search	    Get search results for recipes
* POST   /recipe/link	        Create a relationship between a recipe and a user
* GET	   /list	            Get shopping list details
* PATCH  /list		        Update shopping list
* GET	   /automate	        Get automated calendar results
* GET	   /pull	            Pull recipes into the app from the Spoonacular API

### How to Use:
* Clone this repository using git clone
* Copy example_config.js to config.js and update for your environment
* Go to the root of the cloned folder and run npm install to install Javascript packages
* Run node app.js to run the app at 127.0.0.1:3000
