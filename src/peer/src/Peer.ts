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
import { Post, PostJSONObject } from './Post'
import { getUsername, readFromStream, writeToStream } from './protocols'
import { FileManager } from './FileManager'
import { Multiaddr } from 'multiaddr'
import { Logger, LoggerTopics } from './Logger'
import { MessageExecutor } from './messages/MessageExecutor'
import { FindMessage } from './messages/FindHandler'
import { MessageType } from './messages/MessageHandler'
import { SendingMessage } from './messages/SendingHandler'
import { SendingMessageMonitor } from './SendingMessageMonitor'

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
  sendingMessageMonitor = new SendingMessageMonitor()

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

    for (const user of Array.from(peer.subscribed))
      peer.subscribeUser(user, true)

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

  subscribeUser(user: string, useDelayInFind = false) {
    this.node.pubsub.on(user, (message: PubsubMessage) => {
      new MessageExecutor(message, user, this).execute()
    })
    this.node.pubsub.subscribe(user)
    this.subscribed.add(user)

    this.startFindProtocol(user, useDelayInFind)
  }

  unsubscribeUser(user: string) {
    this.node.pubsub.removeAllListeners(user)
    this.node.pubsub.unsubscribe(user)
    this.subscribed.delete(user)
  }

  sendMessage(topic: string, messageType: MessageType, message: string) {
    this.node.pubsub.publish(topic, this.textEncoder.encode(messageType + "\n\r" + message))
  }

  publish(message: string) {
    const newPost = new Post(this.username, message, new Date())
    this.sendMessage(this.username, MessageType.POST, JSON.stringify(newPost))
    this.ownPosts.push(newPost)
  }

  async startFindProtocol(user: string, useDelay = false, getAll: boolean = false) {
    const findMessage: FindMessage = {
      user,
      requester: this.username,
      timestamp: this.timeline.isEmpty() || getAll ? new Date(2000, 1) : this.timeline.peek().timestamp,
      peerId: this.node.peerId.toB58String()
    }

    if (useDelay) await delay(3000)

    this.sendMessage(user, MessageType.FIND, JSON.stringify(findMessage))
    Logger.log(MessageType.FIND, "Sent message", findMessage)
  }

  private sendSendingMessage(user: string, receiver: string, sendingIds: string[]) {
    const sendingMessage: SendingMessage = {
      receiver,
      posts: sendingIds
    }
    console.log("# Sending sending message", sendingMessage)
    this.sendMessage(user, MessageType.SENDING, JSON.stringify(sendingMessage))
  }

  async sendFoundPosts(user: string, requester: string, timestamp: Date, peerId: PeerId) {
    console.log("sendFoundPosts to requester:", requester)

    const posts = this.findSubsequentPosts(user, timestamp)

    if (posts.length == 0) return

    console.log("# Sending found posts (waiting delay)")
    this.sendingMessageMonitor.startMonitoring(requester)

    await delay(100 + Math.random() * 1000)

    const postsAlreadySent = this.sendingMessageMonitor.getAlreadySent(requester)
    console.log("# End of delay, posts already sent: ", postsAlreadySent)
    this.sendingMessageMonitor.stopMonitoring(requester)

    const postsToSend = posts.filter(post => !postsAlreadySent.has(post.id))

    if (postsToSend.length == 0) return

    const sendingIds = posts.map(post => post.id)
    this.sendSendingMessage(user, requester, sendingIds)

    Logger.log(MessageType.FIND, "Sending found posts", postsToSend)

    const { stream } = await this.node.dialProtocol(peerId, "/posts-receiver")
    writeToStream(JSON.stringify(postsToSend), stream)
  }

  findSubsequentPosts(user: string, timestamp: Date): Post[] {
    const posts: Post[] = []
    const timelineArray = this.timeline.toArray()

    for (let i = Object.keys(timelineArray).length - 1; i >= 0; --i) {
      const post = timelineArray[i]

      if (post.timestamp > timestamp && post.user == user)
        posts.push(post)

      if (post.timestamp <= timestamp) break
    }
    return posts
  }

  addUser(username: string, id: PeerId) {
    this.users.set(username, id)
  }

  addPostToTimeline(post: Post) {
    this.timeline.push(post)
  }

  setupEventListeners() {
    this.node.connectionManager.on('peer:connect', async (connection: Connection) => {
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
      const posts: Array<Post> = JSON.parse(text).map((post: PostJSONObject) => Post.createFromObject(post))

      console.log("Received posts", posts)
      for (const post of posts) {
        this.addPostToTimeline(post)
      }
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
