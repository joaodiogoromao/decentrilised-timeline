export enum LoggerTopics {
  INTERFACE="INTERFACE",
  PEER="PEER",
  DISK="DISK",
  COMMS="COMMS"
}

export class Logger {
  static log(topic: string, ...messages: any[]) {
    console.log(`[${topic}]`, ...messages)
  }
}
