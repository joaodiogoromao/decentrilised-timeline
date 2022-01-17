import { Post } from "../content/TimelinePost"

export interface Connection {
    global: string,
    general: string,
    username: string,
    timeline: string,
    post: string,
    user: (user: string) => string
    postsToKeep: (posts: number) => string
}

export interface GeneralResponse {
    timeline: Array<Post>,
    users: Array<string>,
    subscriptions: Array<string>,
    ownPosts: Array<Post>
}

export const PeerEndpoints = (interfacePort: string): Connection => {
    const global = `http://localhost:${interfacePort}`

    return {
        global,
        general: global + "/general",
        username: global + "/username",
        timeline: global + "/timeline",
        post: global + "/post",
        user: (username: string) => `${global}/user/${username}`,
        postsToKeep: (posts: number) => `${global}/postsToKeep/${posts}`
    }
}
