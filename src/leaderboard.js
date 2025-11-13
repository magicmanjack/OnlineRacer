const leaderboard = {

    delayTime: 350, // Acceptable milliseconds delay time across globe.
    
    timeOffset: 0, // Used in timing calculations, should be set to the start time of the race

    waiting: [], // updates to the leaderboard of the structure {time, playerID} 
    // which will wait for the delayTime before being processed.

    placings: [], // Stores list of {time, playerID} which represents the placings.
    
    popWaiting: function() {
        //Checks the head of the queue and returns waiting that have spent longer than the delay time.
        toReturn = [];
        while(this.waiting.length > 0) {
            if(Date.now() - (this.waiting[0].time + this.timeOffset) > this.delayTime) {
                toReturn.push(this.waiting.shift());

            } else {
                break;
            }
        }

        return toReturn;
    },

    add: function(playerID, timeTaken) {
        //Inserts element in position according to its time value.
        const element = {
            id:playerID,
            time:timeTaken
        }
        for(let i = 0; i < this.waiting.length; i++) {
            if(this.waiting[i].time > element.time) {
                this.waiting.splice(i, 0, element);
                return;
            }
        }
        //Otherwise add to end
        this.waiting.push(element);
    },

    update: function() {
        //Check to see if any leader board updates
        const updates = this.popWaiting();
        if(updates.length > 0) {
            
            for(let i = 0; i < this.placings.length; i++) {
                if(this.placings[i].time > updates[0].time) {
                    this.placings = [...this.placings.slice(0, i), ...updates, this.placings.slice(i, this.placings.length)];
                    console.log(leaderboard.placings);
                    return;
                }
            }
            this.placings.push(...updates);
            console.log(leaderboard.placings);
        }
    }
}