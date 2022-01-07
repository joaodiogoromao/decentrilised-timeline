
export interface Post {
    user: string,
    content: string,
    timestamp: string
}

export interface TimeLineProps {
    data: Array<Post> | null
}

export const TimeLine = ({ data }: TimeLineProps) => {
    return <div>
        <h2>TimeLine</h2>
        { data === null ? "Loading..." : data.map((s: any) => <p>{s.user}, {s.content}, {s.timestamp}</p>) }
    </div>
}
