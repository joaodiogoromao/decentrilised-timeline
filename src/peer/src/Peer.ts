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
import { Post, PostJSONObject } from './Post'
import { getUsername, readFromStream, writeToStream } from './messages/protocols'
import { FileManager } from './utils/FileManager'
import { Multiaddr } from 'multiaddr'
import { Logger, LoggerTopics } from './utils/Logger'
import { MessageExecutor } from './messages/MessageExecutor'
import { FindMessage } from './messages/FindHandler'
import { MessageType } from './messages/MessageHandler'
import { SendingMessage } from './messages/SendingHandler'
import { SendingMessageMonitor } from './messages/SendingMessageMonitor'
import { Timeline } from './timeline/Timeline'
import { CustomPriorityQueue } from './timeline/CustomPriorityQueue'

export interface PeerInfo {
  username: string
  timelineQueue: CustomPriorityQueue<Post>
  timelineSet: Set<string>
  ownPosts: Array<Post>
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
  timeline = new Timeline()
  ownPosts = new Array<Post>()
  sendingMessageMonitor = new SendingMessageMonitor()

  constructor(node: Libp2p, username: string) {
    this.node = node
    this.username = username
    this.writeToFile(5)
  }

  static async createPeerFromFields(peerFields: PeerInfo, boostrapers: Array<string>): Promise<Peer> {
    const peer = await this.createPeer(peerFields.username, boostrapers)
    peer.timeline.setQueue(peerFields.timelineQueue)
    peer.timeline.setSet(peerFields.timelineSet)
    peer.ownPosts = peerFields.ownPosts
    peer.subscribed = peerFields.subscribed

    Logger.wrapped("-", "Read from storage:\n", peer.timeline, peer.ownPosts, peer.subscribed)

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

  publishToTopic(topic: string, messageType: MessageType, message: string) {
    this.node.pubsub.publish(topic, this.textEncoder.encode(messageType + "\n\r" + message))
  }

  publish(message: string) {
    const newPost = new Post(this.username, message, new Date(new Date().toString()))
    this.publishToTopic(this.username, MessageType.POST, JSON.stringify(newPost))
    this.ownPosts.push(newPost)
  }

  async startFindProtocol(user: string, useDelay = false, getAll: boolean = false) {
    const mostRecent = this.timeline.getMostRecent(user)
    const timestamp = mostRecent === undefined || getAll ? new Date(2000, 1) : mostRecent

    if (useDelay) await delay(3000)
    Logger.log(LoggerTopics.FIND, `Looking for ${user}'s posts...`)

    // if this peer knows the user's address, request posts directly from him
    if (this.users.has(user)) {
      const posts = await this.requestPostsFromUser(user, timestamp)

      if (posts != undefined) {
        Logger.log(LoggerTopics.FIND, "Received posts directly from user", posts)

        for (const post of posts)
          this.addPostToTimeline(post)

        return
      }
    }

    // else send message to the user's subscribers
    Logger.log(LoggerTopics.FIND, `Couldn't reach ${user}, trying its subscribers!`)

    const findMessage: FindMessage = {
      user,
      requester: this.username,
      timestamp,
      peerId: this.node.peerId.toB58String()
    }

    this.publishToTopic(user, MessageType.FIND, JSON.stringify(findMessage))
    Logger.log(LoggerTopics.FIND, "Sent message", findMessage)
  }

  // returns true if the posts were obtained, false otherwise
  async requestPostsFromUser(user: string, timestamp: Date): Promise<Array<Post>|undefined> {
    try {

      const { stream } = await this.node.dialProtocol(this.users.get(user) as PeerId, "/get-posts")
      writeToStream(timestamp.toString(), stream)

      return (JSON.parse(await readFromStream(stream)) as Array<PostJSONObject>)
                      .map(post => Post.createFromObject(post))

    } catch (_e) {}

    return undefined
  }

  private publishSendingMessage(user: string, receiver: string, sendingIds: string[]) {
    const sendingMessage: SendingMessage = {
      receiver,
      posts: sendingIds
    }
    Logger.log(LoggerTopics.SENDING, "# Sending SENDING message", sendingMessage)
    this.publishToTopic(user, MessageType.SENDING, JSON.stringify(sendingMessage))
  }

  async sendFoundPosts(user: string, requester: string, timestamp: Date, peerId: PeerId) {
    Logger.log(LoggerTopics.FIND, "sendFoundPosts to requester:", requester)

    const posts = this.findSubsequentPosts(user, timestamp)

    if (posts.length == 0) return

    Logger.log(LoggerTopics.FIND, "# Sending found posts (waiting delay)")
    this.sendingMessageMonitor.startMonitoring(requester)

    await delay(100 + Math.random() * 1000)

    const postsAlreadySent = this.sendingMessageMonitor.getAlreadySent(requester)
    Logger.log(LoggerTopics.FIND, "# End of delay, posts already sent: ", postsAlreadySent)
    this.sendingMessageMonitor.stopMonitoring(requester)

    const postsToSend = posts.filter(post => !postsAlreadySent.has(post.id))

    if (postsToSend.length == 0) return

    const sendingIds = posts.map(post => post.id)
    this.publishSendingMessage(user, requester, sendingIds)

    Logger.log(LoggerTopics.FIND, "Sending found posts", postsToSend)

    const { stream } = await this.node.dialProtocol(peerId, "/posts-receiver")
    writeToStream(JSON.stringify(postsToSend), stream)
  }

  findSubsequentPosts(user: string, timestamp: Date): Post[] {
    const posts: Post[] = []
    const timelineArray = this.timeline.toArray()

    for (let i = 0; i < timelineArray.length; i++) {
      const post = timelineArray[i]

      if (post.timestamp > timestamp && post.user == user)
        posts.push(post)

      if (post.timestamp <= timestamp) break
    }
    return posts
  }

  addKnownUser(username: string, id: PeerId) {
    this.users.set(username, id)
  }

  addPostToTimeline(post: Post) {
    this.timeline.push(post)
  }

  removeOldPosts(postsToKeep: number) {
    this.timeline.keepNPosts(postsToKeep)
  }

  setupEventListeners() {
    this.node.connectionManager.on('peer:connect', async (connection: Connection) => {
      await delay(100)
      const remoteUsername = await getUsername(connection.remotePeer, this.node)
      Logger.log(LoggerTopics.PEER, "Found user " + remoteUsername + " with Id " + connection.remotePeer.toString());
      this.addKnownUser(remoteUsername, connection.remotePeer)
    })

    this.node.handle('/username', async ({ stream }) => {
      await writeToStream(this.username, stream)
    })

    this.node.handle('/get-posts', async ({ stream }) => {
      const timestamp = new Date(await readFromStream(stream))
      const postsReply = []

      for (let i = this.ownPosts.length - 1; i >= 0; i--) {
        if (this.ownPosts[i].timestamp > timestamp) postsReply.push(this.ownPosts[i])
        else break
      }

      Logger.log(LoggerTopics.SENDING, "Sending posts from timestamp", timestamp, postsReply)

      await writeToStream(JSON.stringify(postsReply), stream)
    })

    this.node.handle('/posts-receiver', async ({ stream }) => {
      const text = await readFromStream(stream)
      const posts: Array<Post> = JSON.parse(text).map((post: PostJSONObject) => Post.createFromObject(post))

      Logger.log(LoggerTopics.COMMS, "Received posts", posts)
      for (const post of posts)
        this.addPostToTimeline(post)
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
