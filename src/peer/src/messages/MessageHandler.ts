import { Peer } from "../Peer"


export enum MessageType {
  SENDING = "SENDING",
  FIND = "FIND",
  POST = "POST"
}

export abstract class MessageHandler {
    message: string[]

    constructor(message: string[]) {
        this.message = message
    }

    abstract execute(peer: Peer): void
}
