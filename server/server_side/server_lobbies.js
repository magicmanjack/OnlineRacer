let nextAvailableLobbyID = 0;

function LobbyObject(name, lobbyID) {
    this.name = name;
    this.lobbyID = lobbyID;

}

export const server = {
    lobbies: new Map(), //Maps lobby ID to lobby object
    createLobby:function(name) {
        //Creates a new lobby with the next available lobby ID and returns the ID
        this.lobbies.set(nextAvailableLobbyID, new LobbyObject(name, nextAvailableLobbyID));
        return nextAvailableLobbyID++;
    },
    getLobbyListings:function() {
        /* returns array of the lobby information in the form of 
    {name, playersCount, lobbyID}*/
        const lobbyObjects = this.lobbies.values();

        const listings = [];

        for(const lobbyObject of lobbyObjects) {
            listings.push({
                name:lobbyObject.name,
                playersCount: 0,
                lobbyID:lobbyObject.lobbyID
            })
        }
        
        return listings;

    }

};

server.createLobby("test1");
server.createLobby("test2");
server.createLobby("Bobs lobby");
server.createLobby("Cool people");
server.createLobby("Fast racers");