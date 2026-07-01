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
    }

}