export interface Post {
    user: string,
    content: string,
    timestamp: string
}

export const TimelinePost = ({ data }: { data: Post }) => {
    const date = new Date(data.timestamp)
    return <div className="timeline-post">
        <p>{data.content}</p>
        <div>
            <p>by {data.user}</p>
            <p>{date.toUTCString()}</p>
        </div>
    </div>
}

