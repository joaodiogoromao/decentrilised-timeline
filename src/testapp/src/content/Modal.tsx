import axios from "axios"
import { useContext, useEffect, useState } from "react"
import { EndpointContext } from "../App"
import { Connection } from "../utils/PeerEndpoints"
import { PostList } from "./PostList"
import { Post } from "./TimelinePost"

export interface ModalProps {
    setOpen: (value: boolean) => void,
    username: string
}

export const Modal = ({ setOpen, username }: ModalProps) => {
    const [ posts, setPosts ] = useState<Array<Post> | undefined>(undefined)

    const connection = useContext(EndpointContext) as Connection

    useEffect(() => {
        axios.get(connection.user(username))
            .then(res => setPosts(res.data))
    }, [])

    return <div className="modal-container" onClick={ setOpen.bind(this, false) }>
        <div className="modal" onClick={ e => e.stopPropagation() }>
            <div className="close-button-container">
                <button onClick={ setOpen.bind(this, false) }>Close</button>
            </div>
            { posts ? <PostList data={posts} /> : <p>Loading...</p> }
        </div>
    </div>
}