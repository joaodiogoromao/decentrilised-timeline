import { Logger } from "../Logger";
import { Peer, PubsubMessage } from "../Peer";
import { FindHandler } from "./FindHandler";
import { MessageHandler } from "./MessageHandler";
import { PostHandler } from "./PostHandler";

import { TextDecoder, TextEncoder } from "util"

export class MessageExecutor {
    pubsubMessage: PubsubMessage
    rawMessage: string
    message: MessageHandler
    peer: Peer
    topic: string 
    textDecoder = new TextDecoder()
    textEncoder = new TextEncoder()

    constructor(pubsubMessage: PubsubMessage, topic: string, peer: Peer) {
        this.pubsubMessage = pubsubMessage
        this.rawMessage = this.textDecoder.decode(pubsubMessage.data)
        this.message = this.parseMessage()
        this.peer = peer
        this.topic = topic
    }

    parseMessage(): MessageHandler {
        const splitted = this.rawMessage.split("\n\r")
        const messageId = splitted[0]

        if (messageId == "POST") {
            return new PostHandler(splitted, this.topic)
        } else if (messageId == "FIND") {
            return new FindHandler(splitted)
        } else {
            Logger.log("MESSAGES", `Received unknown message: ${this.pubsubMessage.data}`)
            throw new Error('Ooops')
        }
    }

    execute(): void {
        this.message.execute(this.peer)
    }
}