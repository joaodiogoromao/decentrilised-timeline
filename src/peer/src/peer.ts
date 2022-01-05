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

const createNode = async (bootstrapers: any) => {
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

  return node
};

const subscribeTopic = (node: Libp2p, topic: string) => {
  const textDecoder = new TextDecoder()
  node.pubsub.on(topic, (msg) => {
    console.log(`node received: ${textDecoder.decode(msg.data)}`)
  })
  node.pubsub.subscribe(topic)
}

const sendMessage = (node: Libp2p, topic: string, message: string) => {
  const textEncoder = new TextEncoder()
  node.pubsub.publish(topic, textEncoder.encode(message))
}

(async () => {

  console.log(process.argv);
  
  const node = await createNode([process.argv[3]])
  await node.start()

  const relayMultiaddrs = node.multiaddrs.map((m: any) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)
  console.log(`Node started with multiaddress ${relayMultiaddrs}`)

  node.on('peer:discovery', (peerId: any) => {
    console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
  });

  const topic = "news"

  subscribeTopic(node, topic)
  setInterval(() => {
    sendMessage(node, topic, 'Bird bird bird, bird is the word!')
  }, 1000)
  
})();