export class SendingMessageMonitor {
  private monitored = new Map<string, Set<string>>()

  startMonitoring(receiver: string) {
    this.monitored.set(receiver, new Set())
  }

  stopMonitoring(receiver: string) {
    this.monitored.delete(receiver)
  }

  getAlreadySent(receiver: string): Set<string> {
    if (!this.monitored.has(receiver)) return new Set()
    return this.monitored.get(receiver) as Set<string>
  }

  registerSendingMessage(receiver: string, posts: string[]) {
    if (!this.monitored.has(receiver)) return

    const set = this.monitored.get(receiver)
    for (const postId of posts) set?.add(postId)
  }
}
