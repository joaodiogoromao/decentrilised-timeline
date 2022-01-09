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
import { getUsername, sendReply } from './protocols'
import { FileManager } from './FileManager'
import { Multiaddr } from 'multiaddr'
import { Logger, LoggerTopics } from './Logger'

export interface PeerInfo {
  username: string
  timeline: PQ<Post>
}

export class Peer {
  node: Libp2p;
  username: string;
  textDecoder = new TextDecoder()
  textEncoder = new TextEncoder()
  users: Map<string, PeerId> = new Map()
  subscribed: Set<string> = new Set()
  timeline: PQ<Post>

  constructor(node: Libp2p, username: string) {
    this.node = node
    this.username = username
    const comparator = Post.compare
    this.timeline = new PriorityQueue({ comparator })
    this.writeToFile(5)
  }

  static async createPeerFromFields(peerFields: PeerInfo, boostrapers: Array<string>): Promise<Peer> {
    const peer = await this.createPeer(peerFields.username, boostrapers)
    peer.timeline = peerFields.timeline
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

  subscribeTopic(topic: string) {
    this.node.pubsub.on(topic, (msg) => {
      const post: Post = JSON.parse(this.textDecoder.decode(msg.data))
      this.addPost(post)
      Logger.log(LoggerTopics.COMMS, `Received message from '${topic}': '${post.content}'.`)
    })
    this.node.pubsub.subscribe(topic)
    this.subscribed.add(topic)
  }


  unsubscribeTopic(topic: string) {
    this.node.pubsub.removeAllListeners(topic)
    this.node.pubsub.unsubscribe(topic)
    this.subscribed.delete(topic)
  }

  sendMessage(topic: string, message: string) {
    this.node.pubsub.publish(topic, this.textEncoder.encode(message))
  }

  publish(message: string) {
    this.sendMessage(this.username, JSON.stringify(new Post(this.username, message, new Date())))
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
      await sendReply(this.username, stream)
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
