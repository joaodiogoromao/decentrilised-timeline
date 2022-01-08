export interface Connection {
    global: string,
    timeline: string,
    users: string,
    ping: string
}

export const PeerEndpoints = (interfacePort: string): Connection => {
    const global = `http://localhost:${interfacePort}`

    return {
        global,
        timeline: global + "/timeline",
        users: global + "/users",
        ping: global + "/ping"
    }
}
