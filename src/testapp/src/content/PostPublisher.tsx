import { useState } from "react"

export interface PostPublisherProps {
    publish: (message: string) => void
}

export const PostPublisher = ({ publish }: PostPublisherProps) => {
    const [message, setMessage] = useState("")
    return <div>
        <h2>Publish</h2>
        <textarea id="publish-input" onChange={(event) => setMessage(event.target.value)} value={message} />
        <input type="button" onClick={() => {
            publish(message)
            setMessage("")
        }} value="Publish" />
    </div>
}