/*
    TODO: at the moment the socket address is the set to Jacks homenetwork.
    so get static IP address with server host.
*/
class Client {
    //Use if hosting on Jacks network
    //static wsUri = "ws://222.155.115.120/";

    //Use if hosting locally on LAN
    static wsUri = "ws://localhost:5174";
    //static wsUri = "ws://192.168.1.237:5174";
   

    //Use if hosting on link local
    // static wsUri = "ws://127.0.0.1/";
    //static wsUri = "ws://127.0.0.1/";
    
    static webSocket;
    static connected = false;
    static onMessage;
    static onOpen;
    static onClose;
    static id;
    static state; 

    static connect() {
        Client.webSocket = new WebSocket(Client.wsUri);
        let ws = Client.webSocket;

        ws.onopen = (e) => {
            Client.connected = true;
            if (typeof (Client.onOpen) === "function") {
                Client.onOpen(e);
            }
        };

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