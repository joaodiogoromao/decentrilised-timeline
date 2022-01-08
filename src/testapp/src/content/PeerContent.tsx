import { useEffect, useState } from 'react'
import axios from 'axios'
import { Post, TimeLine } from './TimeLine'
import { Users } from './Users'
import { Connection } from '../utils/PeerEndpoints'

export interface PeerContentProps {
    connection: Connection
}

export const PeerContent = ({ connection }: PeerContentProps) => {
    const [timeline, setTimeline] = useState<Array<Post> | null>(null)
    const [users, setUsers] = useState<Array<string> | null>(null)

    const load = () => {
        setTimeline(null)
        setUsers(null)
        axios.get(connection.timeline)
            .then(data => {
                setTimeline(data.data)
            })
        axios.get(connection.users)
            .then(data => {
                // TODO
                console.log(data.data)
                setUsers(["TODO"])
            })
    }

    useEffect(load, [])

    return <>
        { timeline !== null && users !== null ? <input type="button" value="Reload" onClick={load} /> : undefined }
        <div style={{ display: "flex", gap: "4rem" }}>
            <TimeLine data={timeline} />
            <Users data={users} />
        </div>
    </>
}
