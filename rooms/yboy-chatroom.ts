import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import { getRandomName } from './parse-bonics';

export class Player extends Schema {
    @type("number")
    x = Math.floor(Math.random() * 400);

    @type("number")
    y = Math.floor(Math.random() * 400);

    @type("string")
    sessionId: string;

    @type("string")
    name: string;

    @type("string")
    color: string;

    @type("string")
    image: string;

    constructor(sessionId: string, name: string, color: string, image: string) {
      super();
      this.sessionId = sessionId;
      this.name = name;
      this.color = color;
      this.image = image;
    }
}

export class State extends Schema {
    @type({ map: Player })
    players = new MapSchema<Player>();

    something = "This attribute won't be sent to the client-side";

    createPlayer (id: string) {
      console.log("abc")
        this.players[ id ] = new Player(
          id,
          this.createRandomName(),
          this.createRandomColor(),
          "http://icons.iconarchive.com/icons/ph03nyx/super-mario/128/Retro-Mushroom-1UP-icon.png");
    }

    removePlayer (id: string) {
        delete this.players[ id ];
    }

    movePlayer (id: string, movement: any) {
        if (movement.x) {
            this.players[ id ].x += movement.x * 10;

        } else if (movement.y) {
            this.players[ id ].y += movement.y * 10;
        }
    }

    private createRandomName () {
      return getRandomName();
    }

    private createRandomColor () {
      return `rgb(${[1,2,3].map(x=>Math.random()*230|0)})` // this should return darker colors, to match with white text
      //'#' + Math.floor(Math.random() * 16777215).toString(16);
    }
}

export class YboyChatRoom extends Room<State> {
    maxClients = 20;

    onCreate (options) {
        console.log("StateHandlerRoom created!", options);

        this.setState(new State());

        this.onMessage("message", (client, message: any) => {
            console.log("ChatRoom received message from", client.sessionId, ":", message);
            this.broadcast("messages", message);
        });

        this.onMessage("move", (client, data) => {
            console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
            this.state.movePlayer(client.sessionId, data);
        });
    }

    onAuth(client, options, req) {
        console.log(req.headers.cookie);
        return true;
    }

    onJoin (client: Client) {
        client.send("hello", "world");
        this.state.createPlayer(client.sessionId); // here need to add the random name
        // can be changed to just store the state in the first place
        let newPlayer = this.state.players[client.sessionId]
        this.broadcast("messages", {text: `${newPlayer.name} has joined!`, player: newPlayer});
    }

    onLeave (client) {
        let oldPlayer = this.state.players[client.sessionId]
        this.state.removePlayer(client.sessionId);
        this.broadcast("messages", {text: `${oldPlayer.name} has left.`, player: oldPlayer});
    }

    onDispose () {
        console.log("Dispose StateHandlerRoom");
    }

}

/*

todo:
add chat into this one.
then, give players a random name from random yboy vocab
then, change the movement here into something else
then, try to create a random hand of cards, and give it to players on login

*/
