/* eslint-disable no-console */
'use strict'

import Libp2p, { Connection, MuxedStream } from 'libp2p'
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
import pipe from 'it-pipe'
import { exit } from 'process'
import delay from 'delay'
import PriorityQueue from 'priorityqueue'
import { Comparator } from 'priorityqueue/lib/cjs/comparator'
import { PriorityQueue as PQ } from 'priorityqueue/lib/cjs/PriorityQueue'

class Post {
  user: string
  content: string
  topic: string
  timestamp: Date

  constructor(user: string, topic: string, content: string, timestamp: Date) {
    this.user = user
    this.topic = topic
    this.content = content
    this.timestamp = timestamp
  }

  static compare: Comparator<Post> = (p1: Post, p2: Post) => {
    return p1.timestamp < p2.timestamp ? -1 : 1
  }
}

class Peer {
  _node: Libp2p;
  _username: string;
  _textDecoder = new TextDecoder()
  _textEncoder = new TextEncoder()
  users: Map<String, PeerId> = new Map()
  timeline: PQ<Post>

  constructor(node: Libp2p, username: string) {
    this._node = node
    this._username = username
    const comparator = Post.compare // check
    this.timeline = new PriorityQueue({ comparator })
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

  public get node() {
    return this._node
  }

  public get username() {
    return this._username
  }

  subscribeTopic(topic: string) {
    this._node.pubsub.on(topic, (msg) => {
      this.addPost(JSON.parse(this._textDecoder.decode(msg.data)))
      console.log(`node received: ${this._textDecoder.decode(msg.data)}`)
    })
    this._node.pubsub.subscribe(topic)
  }

  sendMessage(topic: string, message: string) {
    this._node.pubsub.publish(topic, this._textEncoder.encode(message))
  }

  addUser(username: string, id: PeerId) {
    this.users.set(username, id)
  }

  addPost(post: Post) {
    this.timeline.push(post)
  }

  printTimeline() {
    console.log(this.timeline.toArray());
  }
}

async function getUsername(peerId: PeerId, node: Libp2p) {
  const { stream } = await node.dialProtocol(peerId, '/username')
  let username = ""
  await pipe(stream,
    async function (source) {
      for await (const msg of source) {
        username += msg.toString()
      }
    }
  )
  return username
}

async function sendUsername(username: string, stream: MuxedStream) {
  await pipe(username, stream)
}

(async () => {

  if (process.argv.length < 3) {
    console.log("npm run peer <username> [bootstraper]")
    exit(1)
  }

  const peer = await Peer.createPeer(process.argv[2], [process.argv[3]])
  const node = peer.node

  const relayMultiaddrs = node.multiaddrs.map((m: any) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)
  console.log(`Node started with multiaddress ${relayMultiaddrs}`)

  node.connectionManager.on('peer:connect', async (connection: Connection) => {
    console.log(connection.remoteAddr.toString())
    console.log('Connection established to:', connection.remotePeer.toB58String())	// Emitted when a new connection has been created
    await delay(100)
    peer.addUser(await getUsername(connection.remotePeer, node), connection.remotePeer)
  })

  node.handle('/username', async ({ stream }) => {
    await sendUsername(peer.username, stream)
  })

  const topic = "news"

  peer.subscribeTopic(topic)
  setInterval(() => {
    // console.log(peer.users);
    peer.sendMessage(topic, JSON.stringify(new Post(peer.username, topic, "Test", new Date())))
  }, 1000)
  setInterval(() => {
    // console.log(peer.users);
    peer.printTimeline()
  }, 5000)
})();