export interface UserEntryProps {
    username: string,
    isSubscribed: boolean,
    unsubscribe: (username: string) => void,
    subscribe: (username: string) => void
}

export const UserEntry = ({ username, isSubscribed, unsubscribe, subscribe }: UserEntryProps) => {
    return <div className="user-entry" style={{ color: isSubscribed ? "green" : "red" }}>
        <span>{username}</span>
        <input 
            type="button" 
            value={ isSubscribed ? "Unsubscribe" : "Subscribe" }
            onClick={ isSubscribed ? unsubscribe.bind(this, username) : subscribe.bind(this, username) }
        />
    </div>
}
