import { Logger } from "../Logger";
import { Peer } from "../Peer";
import { MessageHandler } from "./MessageHandler";
import PeerId from 'peer-id'

export interface FindMessage {
    user: string,
    timestamp: Date | string,
    peerId: string
}

// FIND timestamp
export class FindHandler extends MessageHandler {
    user: string
    timestamp: Date
    peerId: PeerId

    constructor(message: string[]) {
        super(message)
        if (message[0] != "FIND") {
            Logger.log("MESSAGES", `Tried to create FIND message with wrong id: ${message[0]}`)
            throw new Error('Ooops')
        }

        const findMessage: FindMessage = JSON.parse(message[1])

        Logger.log("FIND", "Received find message", findMessage)

        this.user = findMessage.user
        this.timestamp = new Date(findMessage.timestamp)
        this.peerId = PeerId.createFromB58String(findMessage.peerId)
    }

    execute(peer: Peer): void {
        peer.sendFoundPosts(this.user, this.timestamp, this.peerId)
    }
}