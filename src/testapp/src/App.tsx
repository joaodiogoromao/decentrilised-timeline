import { useEffect, useState } from 'react'
import { PeerContent } from './content/PeerContent'
import { PeerEndpoints } from './utils/PeerEndpoints'
import { RequireConnection } from './utils/RequireConnection'

export const App = () => {
    const [interfacePort, setInterfacePort] = useState("")
    const [_port, _setPort] = useState("")
    const params = new URLSearchParams(window.location.search)

    useEffect(() => {
        setInterfacePort(params.get("port") === null ? "" : params.get("port") as string)
    })

    const updateInterfacePort = () => {
        params.set("port", _port)
        window.location.search = params.toString()
    }

    return <>
        <input type="text" value={_port} onChange={event => _setPort(event.target.value) } />
        <input type="button" value="Load peer" onClick={ updateInterfacePort } />
        
        { interfacePort !== "" ? <RequireConnection endpoint={PeerEndpoints(interfacePort).ping}>
            <PeerContent connection={PeerEndpoints(interfacePort)} />
        </RequireConnection>
        : <p>Waiting for port...</p> }
    </>
}
