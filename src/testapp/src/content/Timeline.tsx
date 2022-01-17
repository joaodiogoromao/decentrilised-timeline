import { PostList } from "./PostList"
import { Post } from "./TimelinePost"

export interface TimelineProps {
    data: Array<Post> | null,
    clearTimeline?: () => void
}

export const Timeline = ({ data, clearTimeline }: TimelineProps) => {
    return <div>
        <h2>Timeline</h2>
        { clearTimeline ? <>
            <input type="button" onClick={clearTimeline} value="Clear" />
        </> : undefined }
        <PostList data={data} />
    </div>
}
