import pipe from 'it-pipe'
import Libp2p, { MuxedStream } from 'libp2p'
import PeerId from 'peer-id'

async function sendRequest(protocol: string, peerId: PeerId, node: Libp2p) {
  const { stream } = await node.dialProtocol(peerId, protocol)
  return readFromStream(stream)
}

export async function getUsername(peerId: PeerId, node: Libp2p) {
  return await sendRequest("/username", peerId, node)
}

export async function readFromStream(stream: MuxedStream) {
  let content = ""

  await pipe(stream,
    async function (source) {
      for await (const msg of source) {
        content += msg.toString()
      }
    }
  )
  return content
}

export async function writeToStream(content: string, stream: MuxedStream) {
  await pipe(content, stream)
}
