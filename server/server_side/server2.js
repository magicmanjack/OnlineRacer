import mime from "mime";
import {clientWebSocketConnected} from "./on_connect.js";
import {clientWebSocketDisconnected} from "./on_disconnect.js";
import {clientWebSocketMessage} from "./on_message.js";

Deno.serve({
    port:5174,
    async handler(request) {
        if (request.headers.get("upgrade") !== "websocket") {
            //Normal http request
            const url = new URL(request.url);
            const filePath = decodeURIComponent(url.pathname);
            if (filePath === "/") {
                //return index.html
                const file = await Deno.open("./index.html", { read: true });
                return new Response(file.readable);
            } else {
                const fileExtension = filePath.split(".").pop();

                // Using the file extension, determine the correct MIME type
                let mimeType = null;
                try {
                    mimeType = mime.getType(fileExtension);
                } catch (error) {
                    console.warn("Couldn't load mime library");
                }

                const file = await Deno.open(`.${filePath}`, { read: true });
                return new Response(
                    file.readable,
                    mimeType
                        ? {
                              headers: {
                                  "content-type": mimeType,
                              },
                          }
                        : null,
                );
            }
        }
        const { socket, response } = Deno.upgradeWebSocket(request);

        socket.onopen = clientWebSocketConnected;

        socket.onmessage = clientWebSocketMessage;

        socket.onclose = clientWebSocketDisconnected;

        socket.onerror = (error) => console.error("ERROR:", error);

        return response;
    }
});