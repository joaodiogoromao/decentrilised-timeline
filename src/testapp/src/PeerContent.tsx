import { useEffect, useState } from 'react'
import axios from 'axios'
import { Post, TimeLine } from './TimeLine'
import { Users } from './Users'

export interface PeerContentProps {
    interfacePort: string
}

export const PeerContent = ({ interfacePort }: PeerContentProps) => {
    const [timeline, setTimeline] = useState<Array<Post> | null>(null)
    const [users, setUsers] = useState<Array<string> | null>(null)
    const url = `http://localhost:${interfacePort}`

    const load = () => {
        setTimeline(null)
        setUsers(null)
        axios.get(`${url}/timeline`)
            .then(data => {
                setTimeline(data.data)
            })
        axios.get(`${url}/users`)
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
