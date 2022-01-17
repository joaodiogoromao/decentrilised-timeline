import { Post, TimelinePost } from "./TimelinePost"

export interface PostListProps {
    data: Array<Post> | null
}

export const PostList = ({ data }: PostListProps) => {
    return <div>
        { data === null ? <p>Loading...</p> : (data.length === 0 ? <p>No posts found.</p> : data.map((post: Post, idx) => 
            <TimelinePost data={post} key={idx} />
        )) }
    </div>
}
