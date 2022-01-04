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

(async () => {
  //   const relay = await createRelayServer({
  //     listenAddresses: ['/ip4/0.0.0.0/tcp/0']
  //   })
  //   console.log(`libp2p relay starting with id: ${relay.peerId.toB58String()}`)
  //   await relay.start()

  const node1 = await createNode([])
  await node1.start()
  
  const relayMultiaddrs = node1.multiaddrs.map((m: any) => `${m.toString()}/p2p/${node1.peerId.toB58String()}`)
  console.log(`Node 1 started with multiaddress ${relayMultiaddrs}`)

  const node2 = await createNode(relayMultiaddrs)
  const node3 = await createNode(relayMultiaddrs)
  //   const [node1, node2] = await Promise.all([
  //     createNode(relayMultiaddrs),
  //     createNode(relayMultiaddrs)
  //   ])

  node1.on('peer:discovery', (peerId: any) => {
    console.log(`Peer ${node1.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
  });
  node2.on('peer:discovery', (peerId: any) => {
    console.log(`Peer ${node2.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
  });
  node3.on('peer:discovery', (peerId: any) => {
    console.log(`Peer ${node3.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
  });

  [node2, node3].forEach((node, index) => console.log(`Node ${index} starting with id: ${node.peerId.toB58String()}`))
  await Promise.all([
    node2.start(),
    node3.start()
  ])

  const topic = "news"

  const textDecoder = new TextDecoder()
  const textEncoder = new TextEncoder()

  node1.pubsub.on(topic, (msg) => {
    console.log(`node1 received: ${textDecoder.decode(msg.data)}`)
  })
  node1.pubsub.subscribe(topic)
  
  node3.pubsub.on(topic, (msg) => {
    console.log(`node3 received: ${textDecoder.decode(msg.data)}`)
  })
  node3.pubsub.subscribe(topic)

  // node2 publishes "news" every second
  setInterval(() => {
    node2.pubsub.publish(topic, textEncoder.encode('Bird bird bird, bird is the word!'))
  }, 1000)
})();