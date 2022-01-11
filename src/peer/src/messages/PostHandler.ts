import { Logger, LoggerTopics } from "../Logger";
import { Peer } from "../Peer";
import { Post } from "../Post";
import { Message } from "./MessageHandler";

// POST postContent
export class PostHandler extends Message {
    post: Post

    constructor(message: string[], topic: string) {
        super(message)
        if (message[0] != "POST") {
            Logger.log("MESSAGES", `Tried to create POST message with wrong id: ${message[0]}`)
            throw new Error('Ooops')
        }
        
        this.post = JSON.parse(message[1])
        console.log(this.post)
        Logger.log(LoggerTopics.COMMS, `Received message from '${topic}': '${this.post.content}'.`)
    }

    execute(peer: Peer): void {
        console.log("#### executing post handler")
        peer.addPost(this.post)
    }
}