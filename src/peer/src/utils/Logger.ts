export enum LoggerTopics {
  INTERFACE="INTERFACE",
  PEER="PEER",
  DISK="DISK",
  COMMS="COMMS",
  MESSAGES="MESSAGES",
  FIND="FIND",
  SENDING="SENDING"
}

export class Logger {
  static log(topic: LoggerTopics, ...messages: any[]) {
    console.log(`[${topic}]`, ...messages)
  }
  static wrapped(divider: string, ...messages: any[]) {
    console.log(divider.repeat(21) + "\n", ...messages, "\n" + divider.repeat(21))
  }
}
