import { Logger, LoggerTopics } from "../utils/Logger";
import { Peer } from "../Peer";
import { MessageHandler, MessageType } from "./MessageHandler";

export interface SendingMessage {
    receiver: string,
    posts: string[]
}

// FIND timestamp
export class SendingHandler extends MessageHandler {
    receiver: string
    posts: string[]

    constructor(message: string[]) {
        super(message)
        if (message[0] != MessageType.SENDING) {
            Logger.log(LoggerTopics.MESSAGES, `Tried to create SENDING message with wrong id: ${message[0]}`)
            throw new Error('Ooops')
        }

        const findMessage: SendingMessage = JSON.parse(message[1])

        Logger.log(LoggerTopics.FIND, "Received sending message", findMessage)

        this.receiver = findMessage.receiver
        this.posts = findMessage.posts
    }

    execute(peer: Peer): void {
        peer.sendingMessageMonitor.registerSendingMessage(this.receiver, this.posts)
    }
}
