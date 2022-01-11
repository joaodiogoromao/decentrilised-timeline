import { Logger } from "../Logger";
import { Peer } from "../Peer";
import { FindHandler } from "./FindHandler";
import { Message } from "./MessageHandler";
import { PostHandler } from "./PostHandler";

import { TextDecoder, TextEncoder } from "util"

export class MessageExecutor {
    messageObj: any
    rawMessage: string
    message: Message
    peer: Peer
    topic: string 
    textDecoder = new TextDecoder()
    textEncoder = new TextEncoder()

    constructor(messageObj: any, topic: string, peer: Peer) {
        this.messageObj = messageObj
        this.rawMessage = this.textDecoder.decode(messageObj.data)
        this.message = this.parseMessage()
        this.peer = peer
        this.topic = topic

        console.log(peer)
    }

    parseMessage(): Message {
        const splitted = this.rawMessage.split("\n\r")
        console.log(splitted)
        const messageId = splitted[0]

        if (messageId == "POST") {
            return new PostHandler(splitted, this.topic)
        } else if (messageId == "FIND") {
            return new FindHandler(splitted)
        } else {
            Logger.log("MESSAGES", `Received unknown message: ${this.messageObj}`)
            throw new Error('Ooops')
        }
    }

    execute(): void {
        console.log("Executing....")
        console.log(this.message)
        this.message.execute(this.peer)
    }
}