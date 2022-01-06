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
import { exit } from 'process'
import delay from 'delay'
import PriorityQueue from 'priorityqueue'
import { PriorityQueue as PQ } from 'priorityqueue/lib/cjs/PriorityQueue'
import Post from './post'
import { randomInt } from 'crypto'
import { getUsername, sendReply } from './protocols'

class Peer {
  node: Libp2p;
  username: string;
  textDecoder = new TextDecoder()
  textEncoder = new TextEncoder()
  users: Map<String, PeerId> = new Map()
  timeline: PQ<Post>

  constructor(node: Libp2p, username: string) {
    this.node = node
    this.username = username
    const comparator = Post.compare
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

  subscribeTopic(topic: string) {
    this.node.pubsub.on(topic, (msg) => {
      this.addPost(JSON.parse(this.textDecoder.decode(msg.data)))
    })
    this.node.pubsub.subscribe(topic)
  }

  sendMessage(topic: string, message: string) {
    this.node.pubsub.publish(topic, this.textEncoder.encode(message))
  }

  addUser(username: string, id: PeerId) {
    this.users.set(username, id)
  }

  addPost(post: Post) {
    this.timeline.push(post)
  }

  findUsernamesOnConnection() {
    this.node.connectionManager.on('peer:connect', async (connection: Connection) => {
      // console.log('Connection established to:', connection.remotePeer.toB58String())	// Emitted when a new connection has been created
      await delay(100)
      const remoteUsername = await getUsername(connection.remotePeer, this.node)
      console.log("Found user " + remoteUsername + " with Id " + connection.remotePeer.toString());
      this.addUser(remoteUsername, connection.remotePeer)
      this.subscribeTopic(remoteUsername)
    })
  
    this.node.handle('/username', async ({ stream }) => {
      await sendReply(this.username, stream)
    })
  }
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

  peer.findUsernamesOnConnection()

  // For manual testing
  setInterval(() => {
    peer.sendMessage(peer.username, JSON.stringify(new Post(peer.username, "Test", new Date(2021, 1, 6, randomInt(10), 0, 0, 0))))
  }, 1000)
  setInterval(() => {
    peer.timeline.toArray()
  }, 5000)
})();