import { useEffect, useState } from 'react'
import { PeerContent } from './content/PeerContent'
import { Layout } from './utils/Layout'
import { PeerEndpoints } from './utils/PeerEndpoints'
import { RequireConnection } from './utils/RequireConnection'

export const App = () => {
    const [interfacePort, setInterfacePort] = useState("")
    const [_port, _setPort] = useState("")
    const params = new URLSearchParams(window.location.search)

    useEffect(() => {
        const port = params.get("port") === null ? "" : params.get("port") as string
        setInterfacePort(port)
        _setPort(port)
    }, [])

    const updateInterfacePort = () => {
        params.set("port", _port)
        window.location.search = params.toString()
    }

    return <Layout>
        <input type="text" value={_port} onChange={event => _setPort(event.target.value) } placeholder="Peer port" />
        <input type="button" value="Load peer" onClick={ updateInterfacePort } />
        
        { interfacePort !== "" ? <>
            <input type="button" value="Close peer" onClick={ () => { setInterfacePort(""); window.location.search = ""; } } />
            <RequireConnection endpoint={PeerEndpoints(interfacePort).username}>
                <PeerContent connection={PeerEndpoints(interfacePort)} />
            </RequireConnection>
        </>
        : <p>Waiting for port...</p> }
    </Layout>
}
