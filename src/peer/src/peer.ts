#!/usr/bin/env node

import libp2p from 'libp2p'
import tcp from 'libp2p-tcp'
import { NOISE } from 'libp2p-noise'
// @ts-ignore
import mplex from 'libp2p-mplex'
import process from 'process'
import { multiaddr } from 'multiaddr'

const startLibp2p = async (node: libp2p) => {
    await node.start()
    console.log('libp2p has started')
}

const stopLibp2p = async (node: libp2p) => {
    await node.stop()
    console.log('libp2p has stopped')
    process.exit(0)
}

const logAdresses = (node: libp2p) => {
    console.log('listening on addresses:')
    node.multiaddrs.forEach(addr => {
        console.log(`${addr.toString()}/p2p/${node.peerId.toB58String()}`)
    })
}

const ping = async (node: libp2p) => {
    if (process.argv.length >= 3) {
        const ma = multiaddr(process.argv[2])
        console.log(`pinging remote peer at ${process.argv[2]}`)
        const latency = await node.ping(ma)
        console.log(`pinged ${process.argv[2]} in ${latency}ms`)
    } else {
        console.log('no remote peer address given, skipping ping')
    }
}

const main = async () => {
    const node: libp2p = await libp2p.create({
        addresses: {
            // add a listen address (localhost) to accept TCP connections on a random port
            listen: ['/ip4/127.0.0.1/tcp/0']
        },
        modules: {
            transport: [tcp],
            connEncryption: [NOISE],
            streamMuxer: [mplex]
        }
    })

    await startLibp2p(node)
    logAdresses(node)
    ping(node)

    process.on('SIGTERM', () => stopLibp2p(node))
    process.on('SIGINT', () => stopLibp2p(node))
}

main()
