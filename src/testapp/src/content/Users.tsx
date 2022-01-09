import { UserEntry } from "./UserEntry"

export interface UsersProps {
    data: Map<string, boolean> | null,
    unsubscribe: (username: string) => void,
    subscribe: (username: string) => void
}

export const Users = ({ data, subscribe, unsubscribe }: UsersProps) => {
    return <div>
        <h2>Users</h2>
        { data === null ? "Loading..." : ( data.size === 0 ? "No users found." : [...data.keys()].map((username, idx) => 
            <UserEntry key={idx} username={username} isSubscribed={data.get(username) as boolean} subscribe={subscribe} unsubscribe={unsubscribe} />
        )) }
    </div>
}
