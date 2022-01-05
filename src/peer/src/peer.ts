/* eslint-disable no-console */
'use strict'

import Libp2p from 'libp2p'
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

class Peer {
  _node: Libp2p;

  constructor(node: Libp2p) {
    this._node = node
  }

  static async createPeer(bootstrapers: any): Promise<Peer> {
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
    return new Peer(node)
  }

  public get node() {
    return this._node
  }

  subscribeTopic(topic: string){
    const textDecoder = new TextDecoder()
    this._node.pubsub.on(topic, (msg) => {
      console.log(`node received: ${textDecoder.decode(msg.data)}`)
    })
    this._node.pubsub.subscribe(topic)
  }

  sendMessage(topic: string, message: string){
    const textEncoder = new TextEncoder()
    this._node.pubsub.publish(topic, textEncoder.encode(message))
  }
}

(async () => {

  console.log(process.argv);

  const peer = await Peer.createPeer([process.argv[2]])
  const node = peer.node

  const relayMultiaddrs = node.multiaddrs.map((m: any) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)
  console.log(`Node started with multiaddress ${relayMultiaddrs}`)

  node.on('peer:discovery', (peerId: any) => {
    console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
  });

  const topic = "news"

  peer.subscribeTopic(topic)
  setInterval(() => {
    peer.sendMessage(topic, 'Bird bird bird, bird is the word!')
  }, 1000)

})();