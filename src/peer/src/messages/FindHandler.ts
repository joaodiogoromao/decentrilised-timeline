import { Logger, LoggerTopics } from "../utils/Logger";
import { Peer } from "../Peer";
import { MessageHandler, MessageType } from "./MessageHandler";
import PeerId from 'peer-id'

export interface FindMessage {
    user: string,
    requester: string,
    timestamp: string | Date,
    peerId: string
}

// FIND timestamp
export class FindHandler extends MessageHandler {
    user: string
    requester: string
    timestamp: Date
    peerId: PeerId

    constructor(message: string[]) {
        super(message)
        if (message[0] != MessageType.FIND) {
            Logger.log(LoggerTopics.MESSAGES, `Tried to create FIND message with wrong id: ${message[0]}`)
            throw new Error('Ooops')
        }

        const findMessage: FindMessage = JSON.parse(message[1])

        Logger.log(LoggerTopics.FIND, "Received find message", findMessage)

        this.user = findMessage.user
        this.requester = findMessage.requester
        this.timestamp = new Date(findMessage.timestamp)
        this.peerId = PeerId.createFromB58String(findMessage.peerId)
    }

    execute(peer: Peer): void {
        peer.sendFoundPosts(this.user, this.requester, this.timestamp, this.peerId)
    }
}
