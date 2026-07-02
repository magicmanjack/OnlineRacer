let nextAvailableLobbyID = 0;

const MAX_PLAYERS_PER_LOBBY = 4;

function LobbyObject(name, lobbyID) {
    this.name = name;
    this.lobbyID = lobbyID;
    this.playersCount = 0;
    this.nextAvailableClientID = 0;
    this.playerUsernames = new Map(); // Maps client id to usernames
    this.socketToClientID = new Map(); // Maps websockets to client ids
    this.checkServerFull = function () {
        return this.playersCount >= MAX_PLAYERS_PER_LOBBY;
    }
    this.checkUsernameAvailable = function(username) {
        //Returns true if username is unique among lobby
        const usernames = this.playerUsernames.values();

        for(const u of usernames) {
            if(u === username) {
                return false;
            }
        }

        return true;
    }
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
                playersCount: lobbyObject.playersCount,
                lobbyID:lobbyObject.lobbyID
            })
        }
        
        return listings;

    },

};

server.createLobby("test1");
server.createLobby("test2");
server.lobbies.get(server.createLobby("Bobs lobby")).playerUsernames.set(1, "bob");
server.lobbies.get(server.createLobby("Cool people")).playersCount = 4;
server.createLobby("Fast racers");