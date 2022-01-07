import pipe from 'it-pipe'
import Libp2p, { MuxedStream } from 'libp2p'
import PeerId from 'peer-id'

async function sendRequest(protocol: string, peerId: PeerId, node: Libp2p) {
  const { stream } = await node.dialProtocol(peerId, protocol)
  let reply = ""
  await pipe(stream,
    async function (source) {
      for await (const msg of source) {
        reply += msg.toString()
      }
    }
  )
  return reply
}

export async function getUsername(peerId: PeerId, node: Libp2p) {
  return await sendRequest("/username", peerId, node)
}

export async function sendReply(reply: string, stream: MuxedStream) {
  await pipe(reply, stream)
}