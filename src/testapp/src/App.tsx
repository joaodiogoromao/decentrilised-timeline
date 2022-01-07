import React, { useEffect } from 'react';
import './App.css';
import { createNode } from './node/node';
import pipe from 'it-pipe'

async function test() {
  const node = await createNode()
  const { stream } = await node.dialProtocol(node.peerId, '/username')
  
  await pipe(stream,
    async function (source) {
      for await (const msg of source) {
        console.log(msg)
      }
    }
  )
}

function App() {
  useEffect(() => {
    test()
  }, [])

  return (
    <div>
      Hey ma dude
    </div>
  );
}

export default App;
