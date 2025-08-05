let lobby = [];

let players = [];
let availableId = 0;
let numConnected = 0;

Deno.serve({
    port: 80,
    async handler(request) {
        if(request.headers.get("upgrade") !== "websocket") {
            //Normal http request
            const url = new URL(request.url);
            const filePath = decodeURIComponent(url.pathname);
            if(filePath === "/") {
                //return index.html
                const file = await Deno.open("./index.html", {read:true});
                return new Response(file.readable);
            } else {
                const file = await Deno.open(`.${filePath}`, {read:true});
                return new Response(file.readable);
            }
        }
        const {socket, response} = Deno.upgradeWebSocket(request);

        socket.onopen = onConnectionOpen;

        socket.onmessage = onPlayerMessage;

        socket.onclose = onConnectionClose;
        socket.onerror = (error) => console.error("ERROR:", error);

        return response;
    }
})

function onConnectionOpen(event) {
    numConnected++;
    console.log(`PLAYER CONNECTED. TOTAL PLAYERS ${numConnected}`);
    lobby.push(this);
    for(let i = 0; i < lobby.length; i++) {
        lobby[i].send(JSON.stringify({
            type:"lobby_update_player_connected",
            num:numConnected
        }));
    }
}

function onConnectionClose(event) {
    numConnected--;
    console.log(`PLAYER DISCONNECTED. TOTAL PLAYERS ${numConnected}`);
    for(let i = 0; i < players.length; i++) {
        if(players[i].socket === this) {
            for(let j = 0; j < players.length; j++) {
                if(i !== j) {
                    players[j].socket.send(JSON.stringify({
                        type: "remove_player",
                        id: players[i].player.id
                    }));
                }
            }
            players.splice(i, 1);
            break;
        }
    }
}

function onPlayerMessage(event) {
    /*
    The main server code. Function called when the player/client sends
    a message.
    */
    const msg = JSON.parse(event.data);

    switch(msg.type) {
        case "get_unique_id":
            this.send(JSON.stringify({
                type:"set_id",
                id:availableId
            }));
            availableId++;
            break;
        case "add_player":
            players.push({
                player:msg.player,
                socket:this,
            });
            for(let i = 0; i < players.length - 1; i++) {
                players[i].socket.send(JSON.stringify({
                    type: "add_player",
                    player: players[players.length-1].player
                }));
                players[players.length-1].socket.send(JSON.stringify({
                    type: "add_player",
                    player: players[i].player
                }));
            }
            break;
        case "player_update":
            for(let i = 0; i < players.length; i++) {
                if(players[i].socket !== this) {
                    players[i].socket.send(JSON.stringify({
                        type:"player_update",
                        player:msg.player
                    }));
                } else {
                    players[i].player = msg.player;
                }
            }
            break;
        case "get_num_players":
            this.send(JSON.stringify({
                type:"num_players",
                numPlayers:numConnected
            }));
            break;
    }
}

