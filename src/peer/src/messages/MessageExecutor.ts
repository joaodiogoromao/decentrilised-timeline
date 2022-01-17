import { Logger, LoggerTopics } from "../utils/Logger";
import { Peer, PubsubMessage } from "../Peer";
import { FindHandler } from "./FindHandler";
import { MessageHandler, MessageType } from "./MessageHandler";
import { PostHandler } from "./PostHandler";

import { TextDecoder, TextEncoder } from "util"
import { SendingHandler } from "./SendingHandler";

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

        if (messageId == MessageType.POST) {
            return new PostHandler(splitted, this.topic)
        } else if (messageId == MessageType.FIND) {
            return new FindHandler(splitted)
        } else if (messageId == MessageType.SENDING) {
            return new SendingHandler(splitted)
        } else {
            Logger.log(LoggerTopics.MESSAGES, `Received unknown message: ${this.pubsubMessage.data}`)
            throw new Error('Ooops')
        }
    }

    execute(): void {
        this.message.execute(this.peer)
    }
}
