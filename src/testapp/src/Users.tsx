
export interface UsersProps {
    data: Array<string> | null
}

export const Users = ({ data }: UsersProps) => {
    return <div>
        <h2>Users</h2>
        { data === null ? "Loading..." : data.map(s => <p>{s}</p>) }
    </div>
}
