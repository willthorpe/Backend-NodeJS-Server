const config = require("../config");
var shuffle = require('shuffle-array');

function automateCalendar(preferences, recipes) {
    //Raw variables
    var busyTimes = JSON.parse(preferences.busy);

    //Collated variables
    var collatedRecipes = [];
    var freeTimes = [];

    /**
     * Algorithm Part 1 - Get the main details for all the recipes
     */
    for (var recipe = 0; recipe < recipes.length; recipe++) {
        collatedRecipes.push({
            'name': recipes[recipe].row[0].name,
            'cookTime': recipes[recipe].row[0].cookTime,
            'prepTime': recipes[recipe].row[0].prepTime,
            'totalTime': recipes[recipe].row[0].cookTime + recipes[recipe].row[0].prepTime,
            'tag': recipes[recipe].row[0].tag
        });
    }

    /**
     * Algorithm Part 2 - Get the hours of free time per day
     */
    var busyItem = 0;

    //Find free time during the events each day
    do {
        //Check if new day for the event
        var start = new Date(busyTimes[busyItem].start);
        if (freeTimes.length === 0 || start.getDay() !== freeTimes[freeTimes.length - 1].start.getDay()) {
            var previousMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
            freeTimes = addToFreeTime(previousMidnight, start, freeTimes, preferences);
        }

        var start = new Date(busyTimes[busyItem].end);
        var end = new Date(busyTimes[(busyItem + 1)].start);

        //If current event is strictly before new event
        if (end - start > 0) {
            if (end.getDate() !== start.getDate()) {
                var futureMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
                //If an event crosses over days
                freeTimes = addToFreeTime(start, futureMidnight, freeTimes, preferences);
            } else {
                //If event does not cross over day
                freeTimes = addToFreeTime(start, end, freeTimes, preferences);
            }
        }
        busyItem = busyItem + 1;
    } while (busyItem < busyTimes.length - 1);

    //Add free time from last event in the week until midnight
    var start = freeTimes[freeTimes.length - 1].end;
    var futureMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
    //Add time until midnight to last event of the last day
    freeTimes = addToFreeTime(start, futureMidnight, freeTimes, preferences);

    /**
     * Algorithm Part 3 - Add Recipes to Calendar
     */
    var mealCalendar = [];

    //Add through best fit/first fit - randomise recipes at the start
    collatedRecipes = shuffle(collatedRecipes);
    //var weekFrequency = preferences.weekFrequency;
    var meals = JSON.parse(preferences.meals);
    var breakfast = createMealTimes(start, meals.breakfast);
    var lunch = createMealTimes(start, meals.lunch);
    var dinner = createMealTimes(start, meals.dinner);
    var eatingTime = preferences.eatingTime;

    for (var k = 0; k < collatedRecipes.length; k++) {
        if (collatedRecipes[k].tag === "breakfast") {
            //Breakfast meals
            findMealSlot("Breakfast", breakfast[2], freeTimes, collatedRecipes[k], eatingTime);
        } else if (collatedRecipes[k].tag === "lunch") {
            //Lunch meals
             findMealSlot("Lunch", lunch[2], freeTimes, collatedRecipes[k], eatingTime);
        } else {
            //Dinner meals
            findMealSlot("dinner", dinner[2], freeTimes, collatedRecipes[k], eatingTime);
        }
    }

    return freeTimes;
}

/**
 * Take a portion of empty time and push how long for each meal into an array
 * @param start
 * @param end
 * @param freeTimes
 * @param preferences
 * @returns {*}
 */
function addToFreeTime(start, end, freeTimes, preferences) {
    //Raw variables
    var meals = JSON.parse(preferences.meals);
    var breakfast = createMealTimes(start, meals.breakfast);
    var lunch = createMealTimes(start, meals.lunch);
    var dinner = createMealTimes(start, meals.dinner);

    //Work out time free for breakfast, lunch and dinner
    var breakfastMinutes = calculateFreeMinutes(start, end, breakfast);
    var lunchMinutes = calculateFreeMinutes(start, end, lunch);
    var dinnerMinutes = calculateFreeMinutes(start, end, dinner);

    //Push to free time events
    freeTimes.push({
        'start': start,
        'end': end,
        'day': start.getDate(),
        'breakfast': breakfastMinutes,
        'lunch': lunchMinutes,
        'dinner': dinnerMinutes,
    });
    return freeTimes;
}

/**
 * Convert the integer meal times to Dates
 * @param start
 * @param meal
 * @returns {*}
 */
function createMealTimes(start, meal) {
    meal['start'] = new Date(start.getFullYear(), start.getMonth(), start.getDate(), meal[0], 0, 0, 0);
    meal['end'] = new Date(start.getFullYear(), start.getMonth(), start.getDate(), meal[1], 0, 0, 0);
    return meal;
}

/**
 * Calculate free minutes for a meal during the free time
 * @param start
 * @param end
 * @param meal
 * @returns {number}
 */
function calculateFreeMinutes(start, end, meal) {
    //Set placeholder
    var freeMinutes = 0;

    //If time is inside bracket take full time
    if (meal['start'] >= start && meal['end'] <= end && meal['end'] > start && meal['start'] < end) {
        freeMinutes = (meal['end'] - meal['start']) / 60000;
    }

    //If event cuts off end meal time
    if (meal['start'] >= start && meal['end'] >= end && meal['end'] > start && meal['start'] < end) {
        freeMinutes = (end - meal['start']) / 60000
    }

    //If event cuts off meal start time
    if (meal['start'] <= start && meal['end'] <= end && meal['end'] > start && meal['start'] < end) {
        freeMinutes = (meal['end'] - start) / 60000;
    }

    //If event cuts off meal start and finish time
    if (meal['start'] <= start && meal['end'] >= end && meal['end'] > start && meal['start'] < end) {
        freeMinutes = Math.abs(((meal['end'] - meal['start']) - (meal['end'] - start) - (end - meal['start'])) / 60000);
    }

    return freeMinutes;
}

function findMealSlot(meal, duplicates, freeTimes, recipe,  eatingTime) {
    var filledSlots = 0;

    for (var slot = 0; slot < freeTimes.length; slot++) {
        //Add to the calendar if it fits
        if(freeTimes[slot][meal] >= (parseInt(recipe.totalTime) + parseInt(eatingTime))){
            if(filledSlots === 0 && duplicates === false || duplicates === true){
                freeTimes[slot][meal] = recipe;
                filledSlots ++;

                //Check other slots and update if no longer needs a meal
                for (var checkSlot = 0; checkSlot < freeTimes.length; checkSlot++) {
                    if(freeTimes[checkSlot]["day"] === freeTimes[slot]["day"]){
                        //Set the times for the rest of the day to 0 for that meal.
                        for (let [key, value] of Object.entries(freeTimes[checkSlot])) {
                            if(key === meal){
                                value = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    return freeTimes;
}

module.exports.automateCalendar = automateCalendar;