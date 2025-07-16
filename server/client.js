/*
    TODO: at the moment the socket address is the set to Jacks homenetwork.
    so get static IP address with server host.
*/
class Client {
    //Use if hosting on Jacks network
<<<<<<< HEAD
    //static wsUri = "ws://222.155.115.120/";
    //Use if hosting locally on LAN
    static wsUri = "ws://10.112.148.252";
    //Use if hosting on link local
=======
    static wsUri = "ws://10.112.148.252/";
>>>>>>> 25f36517ddcdb64572ec20f3d881012bb7a14569
    //static wsUri = "ws://127.0.0.1/";
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
            if (typeof (Client.onOpen) === "function") {
                Client.onOpen(e);
            }
        };

        ws.onmessage = (e) => {
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