import { useState } from "react"
import { Post, TimelinePost } from "./TimelinePost"

export interface TimelineProps {
    data: Array<Post> | null,
    clearTimeline: (posts: number) => void
}

export const Timeline = ({ data, clearTimeline }: TimelineProps) => {
    const [posts, changePosts] = useState("")

    return <div>
        <h2>Timeline</h2>
        <input type="text" value={posts} placeholder="Number of posts to keep" onChange={event => changePosts(event.target.value) }/>
        <input type="button" onClick={clearTimeline.bind(this, parseInt(posts))} value="Clear" />
        { data === null ? <p>Loading...</p> : (data.length === 0 ? <p>No posts found.</p> : data.map((post: Post, idx) => 
            <TimelinePost data={post} key={idx} />
        )) }
    </div>
}
