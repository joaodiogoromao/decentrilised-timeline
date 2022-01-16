import { useState } from "react"
import { Modal } from "./Modal"

export interface UserEntryProps {
    username: string,
    isSubscribed: boolean,
    unsubscribe: (username: string) => void,
    subscribe: (username: string) => void
}

export const UserEntry = ({ username, isSubscribed, unsubscribe, subscribe }: UserEntryProps) => {
    const [ open, setOpen ] = useState(false)
    return <div className="user-entry" style={{ color: isSubscribed ? "green" : "red" }}>
        <span onClick={ setOpen.bind(this, true) } style={{ cursor: "pointer" }}>{username}</span>
        <input 
            type="button" 
            value={ isSubscribed ? "Unsubscribe" : "Subscribe" }
            onClick={ isSubscribed ? unsubscribe.bind(this, username) : subscribe.bind(this, username) }
        />
        { open ? <Modal setOpen={setOpen} username={username} /> : undefined }
    </div>
}
