let players = [];
let availableId = 0;

Deno.serve({
    port: 80,
    handler: function(request) {
        if(request.headers.get("upgrade") !== "websocket") {
            return Response.error();
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
    console.log("PLAYER CONNECTED");
}

function onConnectionClose(event) {
    console.log("PLAYER DISCONNECTED");
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
    }
}

