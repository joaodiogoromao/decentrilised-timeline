import { Post } from '../Post'
import { CustomPriorityQueue } from "./CustomPriorityQueue"

export class Timeline {
  queue: CustomPriorityQueue<Post>
  set: Set<string>

  constructor() {
    this.queue = new CustomPriorityQueue(Post.compare)
    this.set = new Set<string>()
  }

  push(post: Post) {
    if (this.set.has(post.id)) return
    this.set.add(post.id)
    this.queue.add(post)
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
  }

  toArray() {
    return this.queue.toArray()
  }
}
