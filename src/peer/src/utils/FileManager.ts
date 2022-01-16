import { existsSync, mkdirSync, writeFile, readFile } from 'fs'
import { Peer, PeerInfo } from '../Peer'
import { Post, PostJSONObject } from '../Post'
import { CustomPriorityQueue } from '../timeline/CustomPriorityQueue'

interface PeerInfoStore {
  username: string,
  timelineQueue: Array<PostJSONObject|Post>,
  timelineSet: Array<string>,
  ownPosts: Array<PostJSONObject|Post>,
  subscribed: Array<string>
}

export class FileManager {
  static createFile() {
    if (!existsSync("storage")) {
      mkdirSync("storage")
    }
  }

  static async storeInfo(peer: Peer) {
    const peerInfo: PeerInfoStore = {
      username: peer.username,
      timelineQueue: peer.timeline.getQueue().toArray(),
      timelineSet: Array.from(peer.timeline.getSet()),
      ownPosts: peer.ownPosts,
      subscribed: Array.from(peer.subscribed)
    }

    writeFile("storage/" + peer.username + ".json", JSON.stringify(peerInfo), function (err) {
      if (err) {
        console.error("Error writing peer to file")
      }
      //Logger.log(LoggerTopics.DISK, "Saved peer data");
    })
  }

  static async readPeer(username: string): Promise<PeerInfo> {
    return new Promise((resolve, reject) => {
      readFile(`storage/${username}.json`, function (error, data) {
        if (error) {
          console.warn("File not found, continuing normally")
          return reject(error)
        }

        const object: PeerInfoStore = JSON.parse(data.toString())
        const peerInfo: PeerInfo = {
          username: object.username,
          timelineQueue: new CustomPriorityQueue(Post.compare, object.timelineQueue.map(post => Post.createFromObject(post as PostJSONObject))),
          timelineSet: new Set(),
          ownPosts: object.ownPosts.map(post => Post.createFromObject(post as PostJSONObject)),
          subscribed: new Set()
        }
        object.timelineSet.forEach((postId: string) => {
          peerInfo.timelineSet.add(postId)
        })
        object.subscribed.forEach((sub: string) => {
          peerInfo.subscribed.add(sub)
        })

        resolve(peerInfo)
      })
    })
  }

}
