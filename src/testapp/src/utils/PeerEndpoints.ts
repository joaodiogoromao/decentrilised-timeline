export interface Connection {
    global: string,
    timeline: string,
    users: string,
    username: string,
    subscriptions: string,
    post: string,
    user: (user: string) => string
}

export const PeerEndpoints = (interfacePort: string): Connection => {
    const global = `http://localhost:${interfacePort}`

    return {
        global,
        timeline: global + "/timeline",
        users: global + "/users",
        username: global + "/username",
        subscriptions: global + "/subscriptions",
        post: global + "/post",
        user: (username: string) => `${global}/user/${username}`
    }
}
