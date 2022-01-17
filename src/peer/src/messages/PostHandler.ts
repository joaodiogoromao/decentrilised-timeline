import { Logger, LoggerTopics } from "../utils/Logger";
import { Peer } from "../Peer";
import { Post } from "../Post";
import { MessageHandler, MessageType } from "./MessageHandler";

// POST postContent
export class PostHandler extends MessageHandler {
    post: Post

    constructor(message: string[], topic: string) {
        super(message)
        if (message[0] != MessageType.POST) {
            Logger.log(LoggerTopics.MESSAGES, `Tried to create POST message with wrong id: ${message[0]}`)
            throw new Error('Ooops')
        }

        this.post = Post.createFromJSON(message[1])
        Logger.log(LoggerTopics.COMMS, `Received message from '${topic}': '${this.post.content}'.`)
    }

    execute(peer: Peer): void {
        peer.addPostToTimeline(this.post)
    }
}
