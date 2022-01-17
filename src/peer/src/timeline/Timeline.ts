import { Post } from '../Post'
import { CustomPriorityQueue } from "./CustomPriorityQueue"

export class Timeline {
  private queue: CustomPriorityQueue<Post>
  private set: Set<string>
  private mostRecentTimestamp: Map<string, Date>

  constructor() {
    this.queue = new CustomPriorityQueue(Post.compare)
    this.set = new Set<string>()
    this.mostRecentTimestamp = new Map()
  }

  getQueue(): CustomPriorityQueue<Post> {
    return this.queue
  }

  getSet(): Set<string> {
    return this.set
  }

  setQueue(queue: CustomPriorityQueue<Post>) {
    this.mostRecentTimestamp.clear()

    this.queue = queue
    const queueArray = queue.toArray()
    for (let i = queueArray.length - 1; i >= 0; i--) {
      const post = queueArray[i]
      this.mostRecentTimestamp.set(post.user, post.timestamp)
    }
  }

  setSet(set: Set<string>) {
    this.set = set;
  }

  getMostRecent(user: string): Date | undefined {
    return this.mostRecentTimestamp.get(user)
  }

  push(post: Post) {
    if (this.set.has(post.id)) return
    this.set.add(post.id)
    this.queue.add(post)

    const mostRecent = this.mostRecentTimestamp.get(post.user)
    if (mostRecent === undefined || post.timestamp > mostRecent) {
      this.mostRecentTimestamp.set(post.user, post.timestamp)
    }
  }

  peek() {
    return this.queue.at(0)
  }

  isEmpty() {
    return this.queue.size() == 0
  }

  clear() {
    this.set.clear()
    this.queue.clear()
    this.mostRecentTimestamp.clear()
  }

  keepNPosts(numberOfPosts: number) {
    const removedPosts = this.queue.keepNElements(numberOfPosts)
    for (const post of removedPosts) {
      this.set.delete(post.id)
      this.mostRecentTimestamp.delete(post.user)
    }
  }

  toArray() {
    return this.queue.toArray()
  }
}
