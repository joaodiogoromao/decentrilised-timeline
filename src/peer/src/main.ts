/* eslint-disable no-console */
'use strict'

// @ts-ignore
import Mplex from 'libp2p-mplex'
// @ts-ignore
import PubsubPeerDiscovery from 'libp2p-pubsub-peer-discovery'
// @ts-ignore
import createRelayServer from 'libp2p-relay-server'
//@ts-ignore
import Websockets from 'libp2p-websockets'

import { exit } from 'process'
import { initInterface } from './interface/interface'
import { FileManager } from './utils/FileManager'
import { Peer } from './Peer'

const checkArgs = () => {
  if (process.argv.length < 3) {
    console.log("Usage: npm run peer <username> [bootstraper]")
    exit(1)
  }
}

const createPeer = async (username: string, bootstrapper?: string) => {
  try {
    const peerInfo = await FileManager.readPeer(username)
    return await Peer.createPeerFromFields(peerInfo, [bootstrapper as string])
  } catch (e) {
    return await Peer.createPeer(username, [bootstrapper])
  }
}

(async () => {
  checkArgs()

  const username = process.argv[2]
  const bootstrapper = process.argv[3]

  const peer = await createPeer(username, bootstrapper)

  initInterface(peer)

  peer.printMultiaddrs()
  peer.setupEventListeners()
})();
