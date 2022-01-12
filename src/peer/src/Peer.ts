/* eslint-disable no-console */
'use strict'

import Libp2p, { Connection } from 'libp2p'
import TCP from 'libp2p-tcp'
// @ts-ignore
import Mplex from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import Gossipsub from 'libp2p-gossipsub'
import Bootstrap from 'libp2p-bootstrap'
// @ts-ignore
import PubsubPeerDiscovery from 'libp2p-pubsub-peer-discovery'
// @ts-ignore
import createRelayServer from 'libp2p-relay-server'
import { TextEncoder, TextDecoder } from 'util'
import PeerId from 'peer-id'
import delay from 'delay'
import PriorityQueue from 'priorityqueue'
import { PriorityQueue as PQ } from 'priorityqueue/lib/cjs/PriorityQueue'
import { Post } from './Post'
import { getUsername, readFromStream, writeToStream } from './protocols'
import { FileManager } from './FileManager'
import { Multiaddr } from 'multiaddr'
import { Logger, LoggerTopics } from './Logger'
import { MessageExecutor } from './messages/MessageExecutor'
import { FindMessage } from './messages/FindHandler'

export interface PeerInfo {
  username: string
  timeline: PQ<Post>
  ownPosts: PQ<Post>
  subscribed: Set<string>
}

export interface PubsubMessage {
  topicIDs: string[],
  from: string,
  data: Buffer,
  seqno: Buffer,
  signature: Buffer,
  key: Buffer,
  receivedFrom: string
}


export class Peer {
  node: Libp2p;
  username: string;
  textDecoder = new TextDecoder()
  textEncoder = new TextEncoder()
  users: Map<string, PeerId> = new Map()
  subscribed: Set<string> = new Set()
  timeline: PQ<Post>
  ownPosts: PQ<Post>

  constructor(node: Libp2p, username: string) {
    this.node = node
    this.username = username
    const comparator = Post.compare
    this.timeline = new PriorityQueue({ comparator })
    this.ownPosts = new PriorityQueue({ comparator })
    this.writeToFile(5)
  }

  static async createPeerFromFields(peerFields: PeerInfo, boostrapers: Array<string>): Promise<Peer> {
    const peer = await this.createPeer(peerFields.username, boostrapers)
    peer.timeline = peerFields.timeline
    peer.ownPosts = peerFields.ownPosts
    peer.subscribed = peerFields.subscribed

    for (const user of Array.from(peer.subscribed)) {
      peer.subscribeUser(user)
      peer.startFindProtocol(user)
    }
    
    return peer
  }

  static async createPeer(username: string, bootstrapers: any): Promise<Peer> {
    const node = await Libp2p.create({
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0']
      },
      modules: {
        transport: [TCP],
        streamMuxer: [Mplex],
        connEncryption: [NOISE],
        pubsub: Gossipsub,
        peerDiscovery: bootstrapers.length === 0 ? [PubsubPeerDiscovery] : [Bootstrap, PubsubPeerDiscovery]
      },
      config: {
        peerDiscovery:
          bootstrapers.length !== 0 ? {
            [PubsubPeerDiscovery.tag]: {
              interval: 1000,
              enabled: true
            },
            [Bootstrap.tag]: {
              enabled: true,
              list: bootstrapers
            }
          } : {
            [PubsubPeerDiscovery.tag]: {
              interval: 1000,
              enabled: true
            }
          },
        relay: {
          enabled: true, // Allows you to dial and accept relayed connections. Does not make you a relay.
          hop: {
            enabled: true // Allows you to be a relay for other peers
          }
        }
      }
    })

    await node.start()
    return new Peer(node, username)
  }

  subscribeUser(user: string) {
    this.node.pubsub.on(user, (message: PubsubMessage) => {
      console.log("-----> ", message)
      new MessageExecutor(message, user, this).execute()
    })
    this.node.pubsub.subscribe(user)
    this.subscribed.add(user)
  }

  unsubscribeUser(user: string) {
    this.node.pubsub.removeAllListeners(user)
    this.node.pubsub.unsubscribe(user)
    this.subscribed.delete(user)
  }

  sendMessage(topic: string, messageType: string, message: string) {
    console.log("'" + topic + "'")
    this.node.pubsub.publish(topic, this.textEncoder.encode(messageType + "\n\r" + message))
  }

  publish(message: string) {
    const newPost = new Post(this.username, message, new Date())
    this.sendMessage(this.username, "POST", JSON.stringify(newPost))
    this.ownPosts.push(newPost)
  }

  async startFindProtocol(user: string) {
    const findMessage: FindMessage = {
      user,
      timestamp: new Date(2018, 11, 24, 10, 33, 30, 0),
      peerId: this.node.peerId.toB58String()
    }

    await delay(3000)

    console.log("Sending find message")
    console.log(findMessage)
    this.sendMessage(user, "FIND", JSON.stringify(findMessage))
    console.log("Message sent!")
  }

  async sendFoundPosts(user: string, timestamp: Date, peerId: PeerId) {
    const posts = this.findSubsequentPosts(user, timestamp)

    // randomDelay()

    // checkControlChannel() # sent posts #1 and #2 to peer x

    console.log("Sending found posts")

    const { stream } = await this.node.dialProtocol(peerId, "/posts-receiver")
    writeToStream(JSON.stringify(posts), stream)
  }

  findSubsequentPosts(user: string, timestamp: Date): Post[] {
    let posts: Post[] = []
    for (const post of this.timeline.toArray()) {
      if (post.timestamp > timestamp && post.user == user) {
        posts.push()
      }
      if (post.timestamp <= timestamp) {
        break
      }
    }
    return posts
  }

  addUser(username: string, id: PeerId) {
    this.users.set(username, id)
  }

  addPost(post: Post) {
    this.timeline.push(post)
  }

  setupEventListeners() {
    this.node.connectionManager.on('peer:connect', async (connection: Connection) => {
      // console.log('Connection established to:', connection.remotePeer.toB58String())	// Emitted when a new connection has been created
      await delay(100)
      const remoteUsername = await getUsername(connection.remotePeer, this.node)
      Logger.log(LoggerTopics.PEER, "Found user " + remoteUsername + " with Id " + connection.remotePeer.toString());
      this.addUser(remoteUsername, connection.remotePeer)
    })

    this.node.handle('/username', async ({ stream }) => {
      await writeToStream(this.username, stream)
    })

    this.node.handle('/posts-receiver', async ({ stream }) => {
      const text = await readFromStream(stream)
      const posts: Array<Post> = JSON.parse(text)
      
      console.log(posts)
    })
  }

  printMultiaddrs() {
    const relayMultiaddrs = this.node.multiaddrs.map((m: Multiaddr) => `${m.toString()}/p2p/${this.node.peerId.toB58String()}`)
    Logger.log(LoggerTopics.PEER, `Node started with multiaddress ${relayMultiaddrs}`)
  }

  writeToFile(seconds: number) {
    FileManager.createFile()
    setInterval(() => {
      FileManager.storeInfo(this)
    }, seconds * 1000)
  }
}
