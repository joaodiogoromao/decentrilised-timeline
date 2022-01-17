import { PostList } from "./PostList"
import { Post } from "./TimelinePost"

export interface OwnPostsProps {
    data: Array<Post> | null
}

export const OwnPosts = ({ data }: OwnPostsProps) => {
    return <div>
        <h2>Own Posts</h2>
        <PostList data={data} />
    </div>
}
