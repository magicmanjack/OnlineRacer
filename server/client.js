/*
    TODO: at the moment the socket address is the localhost
    so get static IP address with server host.
*/
class Client {
    static wsUri = "ws://127.0.0.1/";
    static webSocket;
    static connected = false;
    static onMessage;
    static onOpen;
    static onClose;

    static connect() {
        Client.webSocket = new WebSocket(Client.wsUri);
        let ws = Client.webSocket;
        
        ws.onopen = (e) => {
            Client.connected = true;
            if(typeof(Client.onOpen) === "function") {
                Client.onOpen(e);
            }
        };

        ws.onmessage = (e) => {
            if(typeof(Client.onMessage) === "function") {
                Client.onMessage(e);
            }
        }

        ws.onclose = (e) => {
            Client.connected = false;
            if(typeof(Client.onClose) === "function") {
                Client.onClose(e);
            }
            
        }

        ws.onerror = (e) => {
            Client.connected = false;
            console.log(`Client error: ${e.data}`);
        };
        
    }


}