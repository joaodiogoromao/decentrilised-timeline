import { Post, TimelinePost } from "./TimelinePost"

export interface TimelineProps {
    data: Array<Post> | null,
    clearTimeline?: () => void
}

export const Timeline = ({ data, clearTimeline }: TimelineProps) => {
    return <div>
        { clearTimeline ? <>
            <h2>Timeline</h2>
            <input type="button" onClick={clearTimeline} value="Clear" />
        </> : undefined }
        { data === null ? <p>Loading...</p> : (data.length === 0 ? <p>No posts found.</p> : data.map((post: Post, idx) => 
            <TimelinePost data={post} key={idx} />
        )) }
    </div>
}
