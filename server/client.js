/*
    TODO: at the moment the socket address is the set to Jacks homenetwork.
    so get static IP address with server host.
*/
class Client {
    //Use if hosting on Jacks network
    //static wsUri = "ws://172.20.10.9:5174";

    //Use if hosting locally on LAN
    //static wsUri = "ws://localhost:5174";
    static wsUri = "ws://172.20.10.9:5174";
   

    //Use if hosting on link local
    //static wsUri = "ws://127.0.0.1/";
    //static wsUri = "ws://127.0.0.1/";
    
    static webSocket;
    static connected = false;
    static onMessage;
    static onOpen;
    static onClose;
    static id;
    static state; 

    static timeOffset; // The offset (in milliseconds) between the clients time (based on performance.now()) and the servers time

    static synchronizeServerTime(iterations=5) {
            let resolveFunction;
            const finishedPromise = new Promise((res, rej) => {
                resolveFunction = res;
            })
            Client.synchronizeServerTimeRec(resolveFunction, iterations);
            return finishedPromise;
    } 

    static synchronizeServerTimeRec(resolveFunction, maxIterations, iteration=0, timeOffsets=[]) {
        /* Once called, performs an algorithm similar to NTP to calculate the time
        difference between the server and the client. This can be useful for game
        network updates that require specific time information. */
        
        //This is a recursive function. 
        // This step happens on the final iteration.
        // Because of the occasional packet drops and other network unknowns which add variation to the recorded times, we need to exclude outliers (over 1 std dev away)
        if(iteration == maxIterations) {
            
            //Calculate std deviation of timeOffsets
            function mean(set) {
                let mean = 0;
                set.forEach((e) => {
                    mean += e;
                });
                mean /= set.length;
                return mean;
            }

            let m = mean(timeOffsets);

            let deviations = timeOffsets.map(num => (num - m)*(num - m));

            let stdDev = Math.sqrt(mean(deviations));
            
            //Remove outliers 
            timeOffsets = timeOffsets.filter((e) => (e <= m + stdDev && e >= m - stdDev));

            Client.timeOffset = mean(timeOffsets);
            resolveFunction();
            return;
        }

        
        //The idea is to send a packet to the server (at time t0) to ask for a response.
        const t0 = performance.now();
        
        Client.webSocket.send(JSON.stringify({type:"time_sync"}));

        //The server recieves the response (at time t1) and responds with a packet (at t2) containing t1 and t2.

        //The client recieves this packet (at t3). The time offset can be calculated with ((t1 - t0) + (t2 - t3)) / 2.

        //Piggy back the websocket.onMessage function to listen for "time_sync_response"
        const originalOnMessage = Client.webSocket.onmessage;
        Client.webSocket.onmessage = function(e) {
            
            const t3 = performance.now();
            originalOnMessage.apply(this, [e]);
            
            const msg = JSON.parse(e.data);

            if(msg.type == "time_sync_response") {
                
                const t1 = msg.t1;
                const t2 = msg.t2;

                timeOffsets.push(((t1 - t0) + (t2 - t3)) / 2);
                //Return onMessage to its former state
                Client.webSocket.onmessage = originalOnMessage;
                //Recursive call
                Client.synchronizeServerTimeRec(resolveFunction, maxIterations, iteration+1, timeOffsets);
            }
        }
        
    }

    static connect() {
        Client.webSocket = new WebSocket(Client.wsUri);
        let ws = Client.webSocket;

        ws.onopen = (e) => {
            Client.connected = true;
            if (typeof (Client.onOpen) === "function") {
                Client.onOpen(e);
            }
        };

        ws.onsend = (e) => {
            if(debug && debugOptions.displayWebsocketOutgoing) {
                console.log("Outgoing data: \n", e);
            }
        }

        //Wrapping send function to provide logging capability
        const originalSend = ws.send;
        ws.send = function(e) {
            originalSend.apply(this, [e]);
            ws.onsend(e);
        }

        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if(msg.type == "set_id") {
                Client.id = msg.id;
            }

            if (typeof (Client.onMessage) === "function") {
                Client.onMessage(e);
            }


        }

        ws.onclose = (e) => {
            Client.connected = false;
            if (typeof (Client.onClose) === "function") {
                Client.onClose(e);
            }

        }

        ws.onerror = (e) => {
            Client.connected = false;
            console.log(`Client error: ${e.data}`);
        };

    }


}