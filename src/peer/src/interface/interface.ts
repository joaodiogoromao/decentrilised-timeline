import express from 'express'
import cors from 'cors'
import { Logger, LoggerTopics } from '../Logger'
import { Peer } from '../Peer'
import bodyParser from 'body-parser'

export const initInterface = (peer: Peer) => {
  const app = express()

  app.use(cors())
  app.use(bodyParser.text())

  app.get('/username', (_req, res) => {
    res.send(peer.username)
  })

  // Get the peer's timeline
  app.get('/timeline', (_req, res) => {
    res.send(peer.timeline.toArray().reverse())
  })

  // Clear timeline
  app.delete('/timeline', (_req, res) => {
    peer.timeline.clear()
    res.send()
  })

  // Get available users
  app.get('/users', (_req, res) => {
    res.send(Array.from(peer.users.keys()))
  })

  // Get subscriptions
  app.get('/subscriptions', (_req, res) => {
    res.send(Array.from(peer.subscribed.keys()))
  })

  // Unsubscribe from user
  app.delete('/user/:username', (req, res) => {
    Logger.log(LoggerTopics.INTERFACE, `Unsubscribing from '${req.params.username}'.`)
    peer.unsubscribeTopic(req.params.username)
    res.send()
  })

  // Subscribe to user
  app.put('/user/:username', (req, res) => {
    Logger.log(LoggerTopics.INTERFACE, `Subscribing to '${req.params.username}'.`)
    peer.subscribeTopic(req.params.username)
    res.send()
  })

  // Publish a post
  app.post('/post', (req, res) => {
    const message = req.body.trim()
    Logger.log(LoggerTopics.INTERFACE, `Publishing '${message}'.`)
    peer.publish(message)
    res.send()
  })

  // Get a user's posts (OPTIONAL)
  app.get('/user/:username', (req, res) => {
    Logger.log(LoggerTopics.INTERFACE, `(NOT IMPLEMENTED) Retrieving posts by '${req.params.username}'.`)
    res.send('NOT IMPLEMENTED')
  })

  app.put('/postsToKeep/:posts', (req, res) => {
    Logger.log(LoggerTopics.INTERFACE, `Keeping ${req.params.posts} most recent posts.`)
    peer.removeOldPosts(parseInt(req.params.posts))
    res.send()
  })

  const server = app.listen(0, () => {
    //@ts-ignore
    const port = server.address().port

    console.log("\n============================================================\n")
    Logger.log(LoggerTopics.INTERFACE, `Peer interface listening on http://localhost:${port}`)
    Logger.log(LoggerTopics.INTERFACE, `Test app on http://localhost:3000/?port=${port}`)
    console.log("\n============================================================\n")
  })
}
