import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { Timeline } from './Timeline'
import { Users } from './Users'
import { Connection, GeneralResponse } from '../utils/PeerEndpoints'
import { ConnectionContext } from '../utils/RequireConnection'
import { PostPublisher } from './PostPublisher'
import { Post } from './TimelinePost'
import { EndpointContext } from '../App'
import { OwnPosts } from './OwnPosts'


export const PeerContent = () => {
    const [timeline, setTimeline] = useState<Array<Post> | null>(null)
    const [ownPosts, setOwnPosts] = useState<Array<Post> | null>(null)
    const [users, setUsers] = useState<Map<string, boolean> | null>(null)

    const connection = useContext(EndpointContext) as Connection;
    const username = useContext(ConnectionContext);

    document.title = username;

    const load = async (setNull: boolean = true) => {
        console.log("Loading...")
        if (setNull) {
            setTimeline(null)
            setUsers(null)
        }

        const res: GeneralResponse = (await axios.get(connection.general)).data;

        setTimeline(res.timeline)
        setOwnPosts([...res.ownPosts].reverse())

        const subscriptions = new Set(res.subscriptions)
        const newUsers = new Map()

        for (const user of res.users as Array<string>)
            newUsers.set(user, subscriptions.has(user))

        setUsers(newUsers)
    }

    const subscribe = (username: string) => axios.put(connection.user(username))
    const unsubscribe = (username: string) => axios.delete(connection.user(username))

    const clearTimeline = (numberOfPosts: number) => numberOfPosts != NaN ? axios.put(connection.postsToKeep(numberOfPosts)) : axios.delete(connection.timeline)

    const publish = (content: string) => axios.post(connection.post, content, { headers: { "content-type": "text/plain" } })

    useEffect(() => {
        setInterval(load.bind(this, false), 1000)
    }, [])

    return <>
        { timeline !== null && users !== null ? <input type="button" value="Reload" onClick={() => load()} /> : undefined }
        <h1>Hi, {username}</h1>

        <PostPublisher publish={publish} />

        <div id="three-column">
            <Timeline data={timeline} clearTimeline={clearTimeline} />
            <OwnPosts data={ownPosts} />
            <Users data={users} subscribe={subscribe} unsubscribe={unsubscribe} />
        </div>
    </>
}
