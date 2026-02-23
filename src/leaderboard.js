const leaderboard = {

    delayTime: 350, // Acceptable milliseconds delay time across globe.
    
    timeOffset: 0, // Used in timing calculations, should be set to the start time of the race

    waiting: [], // updates to the leaderboard of the structure {time, playerID} 
    // which will wait for the delayTime before being processed.

    placings: [], // Stores list of {time, playerID} which represents the placings.

    leaderboardUIDimensions: {
        x: 0, 
        y: 2,
        w: 20,
        h: 20
    },

    placingsUI: [], // Stores the UIPanels that hold each placing.

    visible: false,

    placingUIDimensions: {

        offsetX : 0,
        offsetY : 4,
        scaleX : 0.8,
        scaleY : 0.18 * 0.8

    },

    placingIconUIDimenions: {
        offsetX : 6,
        offsetY : 0,
        scaleX : 0.14,
        scaleY : 0.61
    },
    
    popWaiting: function() {
        //Checks the head of the queue and returns waiting that have spent longer than the delay time.
        let toReturn = [];
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

            if(this.placings.length == 0) {
                this.placings = updates;
            } else {
                for(let i = 0; i < this.placings.length; i++) {

                    if(this.placings[i].time > updates[0].time) {
                        for(let j = 0; j < updates.length; j++) {
                            this.placings.splice(i + j, 0, updates[j]);
                        }
                        //Need to redraw the entire leader board
                        if(this.visible) {
                            for(let i = 0; i < this.placingsUI.length; i++) {
                                removeUIPanel(this.placingsUI[i]);
                            }
                            this.placingsUI = [];
                        }
                        break;
                    } else if(i + 1 == this.placings.length) {
                        
                        this.placings = [...this.placings, ...updates];
                        break;
                    }
                }
                
            }
            if(this.visible) {
                this.show();
            }
        }
    },

    show: function() {
        /*
            instead of redrawing
            the entire table, only draw the placings that are missing.
        */

        const lDim = this.leaderboardUIDimensions;

        if(!this.visible) {
            const leaderboardBG = new UIPanel(lDim.x, lDim.y, lDim.w, lDim.h, ["textures/leaderboard/leaderboard.png"]);
            UILayer.push(leaderboardBG);
            this.visible = true;
        }

        if(this.placings.length - this.placingsUI.length > 0) {
            //There is UI panels that need to be added to leaderboard
            
            for(let i = this.placingsUI.length; i < this.placings.length; i++) {
                const dim = this.placingUIDimensions;
                const iDim = this.placingIconUIDimenions;
                //Offset X and Y from leaderboard middle;
                // i + 1 is also equivalent to the placing.
                
                const placingPanel = new UIPanel(lDim.x + dim.offsetX,
                    lDim.y + dim.offsetY + i * dim.scaleY * lDim.h * -1,
                    lDim.w * dim.scaleX, lDim.h * dim.scaleY,
                    [`textures/leaderboard/leaderboard_player${this.placings[i].id}.png`]);
                this.placingsUI.push(placingPanel);
                UILayer.unshift(placingPanel);
                
                if(i < 3) {
                    let prefixes = ['first', 'second', 'third'];
                    const placingIcon = new UIPanel(lDim.x + dim.offsetX + iDim.offsetX,
                    lDim.y + dim.offsetY + iDim.offsetY + i * dim.scaleY * lDim.h * -1,
                    lDim.w * dim.scaleX * iDim.scaleX, lDim.h * dim.scaleY * iDim.scaleY, [`textures/leaderboard/${prefixes[i]}_place_icon.png`]);
                    UILayer.unshift(placingIcon);
                }
            }
        }
    },
    reset: function() {
        this.visible = false;
        this.waiting = [];
        this.placings = [];
        this.placingsUI = [];
    }
}

function testLeaderboard() {
    leaderboard.add(1, 1);
    leaderboard.add(2, 2);
    leaderboard.add(4, 3);
    leaderboard.add(3, 4);
    leaderboard.show();
}