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
import { getUsername, sendReply } from './protocols'
import Files from './files'
import { Multiaddr } from 'multiaddr'

export interface PeerInfo {
  username: string
  timeline: PQ<Post>
}

class Peer {
  node: Libp2p;
  username: string;
  textDecoder = new TextDecoder()
  textEncoder = new TextEncoder()
  users: Map<string, PeerId> = new Map()
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
      this.addPost(JSON.parse(this.textDecoder.decode(msg.data)))
      console.log("Received message");
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

  writeToFile(seconds: number) {
    Files.createFile()
    setInterval(() => {
      Files.storeInfo(this)
    }, seconds * 1000)
  }
}

export default Peer;

(async () => {

  if (process.argv.length < 3) {
    console.log("npm run peer <username> [bootstraper]")
    exit(1)
  }
  const username = process.argv[2]
  const bootstraper = process.argv[3]

  let peer: Peer
  try {
    const peerInfo = await Files.readPeer(username)
    console.log(peerInfo)
    peer = await Peer.createPeerFromFields(peerInfo, [bootstraper])
  } catch (e) {
    peer = await Peer.createPeer(username, [bootstraper])
  }
  const node = peer.node


  const relayMultiaddrs = node.multiaddrs.map((m: Multiaddr) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)
  console.log(`Node started with multiaddress ${relayMultiaddrs}`)

  peer.findUsernamesOnConnection()

  console.log(peer.timeline.toArray())
  console.log(peer.users);

  // For manual testing
  setInterval(() => {
    peer.sendMessage(peer.username, JSON.stringify(new Post(peer.username, "Test", new Date())))
  }, 1000)
})();