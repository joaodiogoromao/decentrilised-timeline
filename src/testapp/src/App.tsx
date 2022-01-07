import { useEffect, useState } from 'react'
import { PeerContent } from './PeerContent'

export const App = () => {
    const [interfacePort, setInterfacePort] = useState("")
    const [_port, _setPort] = useState("")

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        setInterfacePort(params.get("port") === null ? "" : params.get("port") as string)
    })

    return <>
        <input type="text" value={_port} onChange={event => _setPort(event.target.value) } />
        <input type="button" value="Load peer" onClick={ () => setInterfacePort(_port) } />
        
        { interfacePort !== "" ? <PeerContent interfacePort={interfacePort} /> : <p>Waiting for port...</p> }
    </>
}
