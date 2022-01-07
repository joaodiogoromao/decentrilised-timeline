import libp2p from 'libp2p'
//@ts-ignore
import Websockets from 'libp2p-websockets'
//@ts-ignore
import filters from 'libp2p-websockets/src/filters'
//@ts-ignore
import MPLEX from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import pipe from 'it-pipe'
import PeerId from 'peer-id'


const transportKey = Websockets.prototype[Symbol.toStringTag]

export const createNode = () => {
    return libp2p.create({
      modules: {
        transport: [Websockets],
        streamMuxer: [MPLEX],
        connEncryption: [NOISE]
      },
      config: {
        transport: {
          [transportKey]: { // Transport properties -- Libp2p upgrader is automatically added
            filter: filters.dnsWsOrWss
          }
        }
      }
    })
}

export async function sendRequest(protocol: string, peerId: PeerId, node: libp2p) {
    const { stream } = await node.dialProtocol(peerId, protocol)
    let reply = ""
    await pipe(stream,
      async function (source: any) {
        for await (const msg of source) {
          reply += msg.toString()
        }
      }
    )
    return reply
}
