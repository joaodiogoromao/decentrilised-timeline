import { PostList } from "./PostList"
import { Post } from "./TimelinePost"
import { useState } from "react"

export interface TimelineProps {
    data: Array<Post> | null,
    clearTimeline?: (posts: number) => void
}

export const Timeline = ({ data, clearTimeline }: TimelineProps) => {
    const [posts, changePosts] = useState("")

    return <div>
        <h2>Timeline</h2>
        { clearTimeline ? <>
            <input type="text" value={posts} placeholder="Number of posts to keep" onChange={event => changePosts(event.target.value) }/>
            <input type="button" onClick={clearTimeline.bind(this, parseInt(posts))} value="Clear" />
        </> : undefined }
        <PostList data={data} />
    </div>
}
