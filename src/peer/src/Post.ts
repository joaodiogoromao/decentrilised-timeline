import { Comparator } from 'priorityqueue/lib/cjs/comparator'

export class Post {
  user: string
  content: string
  timestamp: Date

  constructor(user: string, content: string, timestamp: Date) {
    this.user = user
    this.content = content
    this.timestamp = timestamp
  }

  static compare: Comparator<Post> = (p1: Post, p2: Post) => {
    return p1.timestamp > p2.timestamp ? -1 : 1 // Sort by descending order (today appears before than yesterday)
  }
}
