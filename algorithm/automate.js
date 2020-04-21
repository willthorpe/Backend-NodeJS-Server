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
            'totalTime': parseInt(recipes[recipe].row[0].cookTime) + parseInt(recipes[recipe].row[0].prepTime),
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

        start = new Date(busyTimes[busyItem].end);
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
    start = freeTimes[freeTimes.length - 1].end;
    futureMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
    //Add time until midnight to last event of the last day
    freeTimes = addToFreeTime(start, futureMidnight, freeTimes, preferences);

    /**
     * Algorithm Part 3 - Find Slots for Meals in Calendar
     */

    //var weekFrequency = preferences.weekFrequency;
    var eatingTime = preferences.eatingTime;

    for (var k = 0; k < collatedRecipes.length; k++) {
        if (collatedRecipes[k].tag === "Breakfast") {
            //Breakfast meals
            findMealSlot("breakfast", freeTimes, collatedRecipes[k], eatingTime);
        } else if (collatedRecipes[k].tag === "Lunch") {
            //Lunch meals
            findMealSlot("lunch", freeTimes, collatedRecipes[k], eatingTime);
        } else if (collatedRecipes[k].tag === "Dinner") {
            //Dinner meals
            findMealSlot("dinner", freeTimes, collatedRecipes[k], eatingTime);
        } else if (collatedRecipes[k].tag === "Main Meal"){
            findMealSlot("lunch", freeTimes, collatedRecipes[k], eatingTime);
            findMealSlot("dinner", freeTimes, collatedRecipes[k], eatingTime);
        }
    }

    //Merge slots together for each meal
    var day = 0;
    var collatedSlot = 0;
    var collatedTimes = [];
    for (var slot = 0; slot < freeTimes.length; slot++) {
        if (freeTimes[slot]['day'] === day) {
            //If same day
            collatedSlot['breakfastMeals'] = collatedSlot['breakfastMeals'].concat(freeTimes[slot]['breakfastMeals']);
            collatedSlot['lunchMeals'] = collatedSlot['lunchMeals'].concat(freeTimes[slot]['lunchMeals']);
            collatedSlot['dinnerMeals'] = collatedSlot['dinnerMeals'].concat(freeTimes[slot]['dinnerMeals']);
            freeTimes[slot] = '';
        } else {
            //If different day to the above
            if (day !== 0) {
                collatedTimes.push(collatedSlot);
            }
            day = freeTimes[slot]['day'];
            collatedSlot = freeTimes[slot];
        }
    }
    //Add last day
    console.log(collatedSlot);
    collatedTimes.push(collatedSlot);

    /**
     * Algorithm Part 4 - Best Fit Recipes in each slot
     */
    var mealCalendar = [];
    var meals = JSON.parse(preferences.meals);
    var breakfast = createMealTimes(start, meals.breakfast);
    var lunch = createMealTimes(start, meals.lunch);
    var dinner = createMealTimes(start, meals.dinner);

    for (var calendarDay = 0; calendarDay < collatedTimes.length; calendarDay++) {
        mealCalendar.push({
            'breakfast': '',
            'lunch': '',
            'dinner': '',
            'day': collatedTimes[calendarDay]['day']
        });

        //Breakfast
        mealCalendar = bestFitMeals(mealCalendar, shuffle(collatedTimes[calendarDay]['breakfastMeals']), 'breakfast', breakfast[2]);

        //Lunch
        mealCalendar = bestFitMeals(mealCalendar, shuffle(collatedTimes[calendarDay]['lunchMeals']), 'lunch', lunch[2]);

        //Dinner
        mealCalendar = bestFitMeals(mealCalendar, shuffle(collatedTimes[calendarDay]['dinnerMeals']), 'dinner', dinner[2]);

    }

    return mealCalendar;
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

    //Push to free time array
    freeTimes.push({
        'start': start,
        'end': end,
        'day': start.getDate(),
        'breakfastMeals': [],
        'breakfast': breakfastMinutes,
        'lunchMeals': [],
        'lunch': lunchMinutes,
        'dinnerMeals': [],
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

/**
 * Find slots in the calendar for each meal
 * @param meal
 * @param freeTimes
 * @param recipe
 * @param eatingTime
 * @returns {*}
 */
function findMealSlot(meal, freeTimes, recipe, eatingTime) {
    for (var slot = 0; slot < freeTimes.length; slot++) {
        //Add to the calendar if it fits
        if (freeTimes[slot][meal] >= (parseInt(recipe.totalTime) + parseInt(eatingTime))) {
            recipe['plannedTime'] = freeTimes[slot][meal];
            freeTimes[slot][(meal + 'Meals')].push(recipe);
        }
    }

    return freeTimes;
}

/**
 * Combine free slots into each day in calendar
 * @param mealCalendar
 * @param slot
 * @param meal
 * @param duplicates
 * @returns {*}
 */
function bestFitMeals(mealCalendar, slot, meal, duplicates) {
    if (slot != null && slot.length > 1) {
        //If multiple meals
        var bestTime = 9999; //The least wasted time for the meal slot
        var bestMeal; //The current chosen meal for the slot.
        for (var i = 0; i < slot.length; i++) {
            var occurrences = 0;
            if (duplicates === false) {
                //If no duplicates, count occurrences and make sure it is only one.
                for (var j = 0; j < mealCalendar.length; j++) {
                    if(mealCalendar[j][meal] === slot[i]['name']){
                        occurrences++;
                    }
                }
                if(occurrences > 0){
                    continue;
                }
            }

            //Find the time the meal needs and set it as meal if better than the last meal
            if (slot[i]['plannedTime'] - slot[i]['totalTime'] < bestTime) {
                bestTime = slot[i]['plannedTime'] - slot[i]['totalTime'];
                bestMeal = slot[i]['name'];
            }
        }
        //Add meal to meal calendar
        if(bestMeal != null){
            mealCalendar[mealCalendar.length - 1][meal] = bestMeal;
        }
    } else if (slot != null && slot.length === 1) {
        //If only one meal option
        mealCalendar[mealCalendar.length - 1][meal] = slot[0]['name'];
    }
    return mealCalendar;
}

module.exports.automateCalendar = automateCalendar;