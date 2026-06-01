## In-Game Snapshots
<img width="943" height="606" alt="Screenshot 2026-05-31 at 11 07 53 PM" src="https://github.com/user-attachments/assets/7bdfbfe5-2cb2-4763-874f-96b7b27ade0d" />
<img width="640" height="328" alt="forgithub" src="https://github.com/user-attachments/assets/4700924e-2d80-450e-9a0a-1aef5edf0278" />

# OnlineRacer

## About
A realtime online multiplayer fast paced racing game with arcade/low poly style as the inspiration.

## Requirements

* [Deno](https://deno.com/) (latest version)
* [Node.js and NPM](https://nodejs.org/en/download/) (latest LTS version ideally)

## How to Run
1. Install Deno and Node.js. Links to the requirements are provided above. Follow the installation instructions for each requirement.
2. Install npm dependencies by running the following command in the project root directory:
    ```
    npm install
    ```
3. Once all npm dependencies are installed, you can start the project by running this command:
    ```
    deno run --allow-read=. --allow-net=0.0.0.0:5174 server/server.js
    ```
4. This will start the server on localhost. Open up your browser of choice and go to [127.0.0.1:5174](http://127.0.0.1:5174)

