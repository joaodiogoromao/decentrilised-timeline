import { existsSync, mkdirSync, writeFile, readFile } from 'fs'
import PriorityQueue from 'priorityqueue'
import Peer from './peer'
import { PeerInfo } from './peer'
import Post from './post'

class Files {
  static createFile() {
    if (!existsSync("storage")) {
      mkdirSync("storage")
    }
  }

  static async storeInfo(peer: Peer) {
    const peerInfo = {
      username: peer.username,
      timeline: peer.timeline.toArray()
    }

    writeFile("storage/" + peer.username + ".json", JSON.stringify(peerInfo), function (err) {
      if (err) {
        console.log("Error writing peer to file")
      }
      console.log("Wrote successfully");
    })
  }

  static async readPeer(username: string): Promise<PeerInfo> {
    return new Promise((resolve, reject) => {
      readFile(`storage/${username}.json`, function (error, data) {
        if (error) {
          console.log("File not found, continuing normally")
          return reject(error)
        }

        console.log("Read successfully");

        const object = JSON.parse(data.toString())
        const comparator = Post.compare
        const peerInfo: PeerInfo = {
          username: object.username,
          timeline: new PriorityQueue({ comparator })
        }
        object.timeline.forEach((post: any) => {
          peerInfo.timeline.push(<Post>post)
        });

        resolve(peerInfo)
      })
    })
  }

}

export default Files;
