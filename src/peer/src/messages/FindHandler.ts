import { Logger } from "../Logger";
import { Message } from "./MessageHandler";

// FIND timestamp
export class FindHandler extends Message {
    timestamp: string

    constructor(message: string[]) {
        super(message)
        if (message[0] != "POST") {
            Logger.log("MESSAGES", `Tried to create FIND message with wrong id: ${message[0]}`)
            throw new Error('Ooops')
        }
        this.timestamp = message[1]
    }

    execute(): void {
        
    }
}