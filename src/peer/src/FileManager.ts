import { existsSync, mkdirSync, writeFile, readFile } from 'fs'
import PriorityQueue from 'priorityqueue'
import { Peer, PeerInfo } from './Peer'
import { Post } from './Post'

export class FileManager {
  static createFile() {
    if (!existsSync("storage")) {
      mkdirSync("storage")
    }
  }

  static async storeInfo(peer: Peer) {
    const peerInfo = {
      username: peer.username,
      timeline: peer.timeline.toArray(),
      ownPosts: peer.ownPosts.toArray()
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

        const object = JSON.parse(data.toString())
        const comparator = Post.compare
        const peerInfo: PeerInfo = {
          username: object.username,
          timeline: new PriorityQueue({ comparator }),
          ownPosts: new PriorityQueue({ comparator })
        }
        object.timeline.forEach((post: any) => {
          peerInfo.timeline.push(<Post>post)
        });

        resolve(peerInfo)
      })
    })
  }

}
