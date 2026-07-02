import {server} from "./server_lobbies.js";

export function clientWebSocketMessage(event) {
    const msg = JSON.parse(event.data);
    
    const sendBack = (msg) => {
        //Shorter way of typing this
        this.send(JSON.stringify(msg));
    }
    switch(msg.type) {
        case "get_lobby_listings":
            sendBack({
                type: "lobby_listings",
                lobbyListings: server.getLobbyListings()
            })
            break;
        case "join_lobby":
            //Get lobby object
            const lobby = server.lobbies.get(msg.lobbyID);
            if(lobby) {
                if(lobby.checkServerFull()) {
                    sendBack({
                        type: "lobby_join_unsuccessful",
                        reason: "lobby_full"
                    })
                } else {
                    if(lobby.checkUsernameAvailable(msg.username)) {
                        //TODO enlist player in lobby
                        sendBack({
                            type: "lobby_join_successful"
                        });
                    } else {
                        sendBack({
                            type: "lobby_join_unsuccessful",
                            reason: "username_taken"
                        })
                    }
                }
            } else {
                sendBack({
                    type: "lobby_join_unsuccessful",
                    reason: "lobby_id_invalid"
                })
            }
            break;
    }

}