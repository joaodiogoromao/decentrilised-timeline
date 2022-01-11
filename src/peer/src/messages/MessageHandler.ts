import { Peer } from "../Peer"


export abstract class Message {
    message: string[]

    constructor(message: string[]) {
        this.message = message
    }

    abstract execute(peer: Peer): void
}