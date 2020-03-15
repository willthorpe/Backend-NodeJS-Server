const config = require("../config");

function automateCalendar(preferences, recipes) {
    //Raw variables
    var busyTimes = JSON.parse(preferences.busy);

    //Collated variables
    var collatedRecipes = [];
    var freeTimes = [];

    /**
     * Algorithm Part 1 - Get the main details for all the recipes
     */
    for (var i = 0; i < recipes.length; i++) {
        collatedRecipes.push({
            'name': recipes[0].row[0].name,
            'cookTime': recipes[0].row[0].cookTime,
            'prepTime': recipes[0].row[0].prepTime,
            'tag': recipes[0].row[0].tag
        });
    }

    /**
     * Algorithm Part 2 - Get the hours of free time per day
     */
        //Find free time during the days
    var busyItem = 0;
    do {
        var start = new Date(busyTimes[busyItem].end);
        var end = new Date(busyTimes[(busyItem + 1)].start);

        //If the first event happens after midnight
        if (freeTimes.length === 0 || start.getDate() > freeTimes[freeTimes.length - 1].day) {
            var previousMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
            if (freeTimes.length > 0) {
                var yesterdayEvent = freeTimes[freeTimes.length - 1].end;
                freeTimes = addToFreeTime(yesterdayEvent, previousMidnight, freeTimes, preferences);
                //Add time until midnight to last event of the last day
                freeTimes = addToFreeTime(previousMidnight, start, freeTimes, preferences);
            } else {
                freeTimes = addToFreeTime(previousMidnight, start, freeTimes, preferences);
            }
        }

        //If current event is strictly before new event
        if (end - start > 0) {
            if (end.getDate() !== start.getDate()) {
                var futureMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0, 0);
                //If an event crosses over days
                freeTimes = addToFreeTime(start, futureMidnight, freeTimes, preferences);
            } else {
                //If event does not cross over day
                freeTimes = addToFreeTime(start, end, freeTimes, preferences);
            }
        }
        busyItem = busyItem + 1;
    } while (busyItem < busyTimes.length - 1);

    //Add free time from last event to midnight
    var start = freeTimes[freeTimes.length - 1].end;
    var futureMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0, 0);
    //Add time until midnight to last event of the last day
    freeTimes = addToFreeTime(start, futureMidnight, freeTimes, preferences);

    /**
     * Algorithm Part 3 - Add Recipes to Calendar
     */
    console.log(freeTimes);
    console.log(collatedRecipes);
}

function addToFreeTime(start, end, freeTimes, preferences) {
    //Raw variables
    var breakfast = createMealTimes(start, JSON.parse(preferences.breakfast));
    var lunch = createMealTimes(start, JSON.parse(preferences.lunch));
    var dinner = createMealTimes(start, JSON.parse(preferences.dinner));
    var week = JSON.parse(preferences.week);

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

function createMealTimes(start, meal) {
    meal[0] = new Date(start.getFullYear(), start.getMonth(), start.getDate(), meal[0], 0, 0, 0);
    meal[1] = new Date(start.getFullYear(), start.getMonth(), start.getDate(), meal[1], 0, 0, 0);
    return meal;
}

function calculateFreeMinutes(start, end, meal) {
    //Set placeholder
    var freeMinutes = 0;

    //If time is inside bracket take full time
    if (meal[0] > start && meal[1] < end && meal[1] > start && meal[0] < end) {
        freeMinutes = (meal[1] - meal[0]) / 60000;
    }

    //If event cuts off end meal time
    if (meal[0] > start && meal[1] > end && meal[1] > start && meal[0] < end) {
        freeMinutes = (end - meal[0]) / 60000
    }

    //If event cuts off meal start time
    if (meal[0] < start && meal[1] < end && meal[1] > start && meal[0] < end) {
        freeMinutes = (meal[1] - start) / 60000;
    }

    //If event cuts off meal start and finish time
    if (meal[0] < start && meal[1] > end && meal[1] > start && meal[0] < end) {
        freeMinutes = Math.abs(((meal[1] - meal[0]) - (meal[1] - start) - (end - meal[0])) / 60000);
    }

    return freeMinutes;
}

module.exports.automateCalendar = automateCalendar;