import crypto from 'crypto'

export interface PostJSONObject {
  user: string,
  content: string,
  timestamp: string
}

export class Post {
  user: string
  content: string
  timestamp: Date
  id: string

  constructor(user: string, content: string, timestamp: Date) {
    this.user = user
    this.content = content
    this.timestamp = timestamp
    this.id = crypto.createHash('sha1').update(user + content + timestamp.toString()).digest('hex');
  }

  static compare(p1: Post, p2: Post) {
    return p1.timestamp > p2.timestamp ? -1 : 1 // Sort by descending order (today appears before than yesterday)
  }

  static createFromObject(post: PostJSONObject) {
    return new Post(post.user, post.content, new Date(post.timestamp))
  }

  static createFromJSON(post: string) {
    return Post.createFromObject(JSON.parse(post))
  }
}
