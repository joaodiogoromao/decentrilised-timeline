import express from 'express'
import cors from 'cors'
import { Logger, LoggerTopics } from '../Logger'
import { Peer } from '../Peer'

export const initInterface = (peer: Peer) => {
  const app = express()

  app.use(cors())

  app.get('/timeline', (_req, res) => {
    res.send(peer.timeline.toArray())
  })

  app.get('/users', (_req, res) => {
    res.send(peer.users)
  })

  const server = app.listen(0, () => {
    //@ts-ignore
    const port = server.address().port
    Logger.log(LoggerTopics.INTERFACE, `Peer interface listening on http://localhost:${port}`)
    Logger.log(LoggerTopics.INTERFACE, `Test app on http://localhost:3000/?port=${port}`)
  })
}
