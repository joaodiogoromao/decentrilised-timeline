/* eslint-disable no-console */
'use strict'

import Libp2p, { MuxedStream } from 'libp2p'
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

class Peer {
  _node: Libp2p;
  _username: string;
  _textDecoder = new TextDecoder()
  _textEncoder = new TextEncoder()

  constructor(node: Libp2p, username: string) {
    this._node = node
    this._username = username
  }

  static async createPeer(username: string, bootstrapers: any): Promise<Peer> {
    // const peerId = PeerId.createFromB58String(username)
    const node = await Libp2p.create({
      // peerId: peerId,
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

  subscribeTopic(topic: string){
    this._node.pubsub.on(topic, (msg) => {
      console.log(`node received: ${this._textDecoder.decode(msg.data)}`)
    })
    this._node.pubsub.subscribe(topic)
  }

  sendMessage(topic: string, message: string){
    this._node.pubsub.publish(topic, this._textEncoder.encode(message))
  }
}

async function getUsername(peerId: PeerId, node: Libp2p) {
  const {stream} = await node.dialProtocol(peerId, '/username')
  await pipe(stream,
    async function(source) {
      for await (const msg of source) {
        console.log(msg.toString());
      }
    }
  )
}

async function sendUsername(username: string, stream: MuxedStream) {
  pipe(username, stream)
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

  node.on('peer:discovery', (peerId: PeerId) => {
    console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
    getUsername(peerId, node)
  });

  node.handle('/username', async ({ stream }) => {
    sendUsername(peer.username, stream)
  })

  const topic = "news"

  peer.subscribeTopic(topic)
  setInterval(() => {
    peer.sendMessage(topic, 'Bird bird bird, bird is the word!')
  }, 1000)

})();