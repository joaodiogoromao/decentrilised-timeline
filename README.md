# SDLE Project

SDLE Project for group T4G15.

Group members:

1. João Pires (up201806079@edu.fe.up.pt)
2. João Romão (up201806779@edu.fe.up.pt)
3. Rafael Cristino (up201806680@edu.fe.up.pt)
4. Xavier Pisco (up201806134@edu.fe.up.pt)

## How to run

1. Install dependencies
```bash
cd src/testapp
npm install
cd ../peer
npm install
```

2. Start the test app
```bash
cd src/testapp
npm start
```

3. Start a bootstrap peer
```bash
cd ../peer
npm run peer <peer_username>
```

Note: once you start the bootstrap peer, you need to use one of its multiaddresses. From the log line:
```
[PEER] Node started with multiaddress /ip4/127.0.0.1/tcp/45655/p2p/QmXTwd6AFWBDCvrcy86fge6HxNKgH2vPmrrjFTNTKQihwe,/ip4/192.168.0.104/tcp/45655/p2p/QmXTwd6AFWBDCvrcy86fge6HxNKgH2vPmrrjFTNTKQihwe,/ip4/172.20.0.1/tcp/45655/p2p/QmXTwd6AFWBDCvrcy86fge6HxNKgH2vPmrrjFTNTKQihwe
```
You can take an address to be used, for example, `/ip4/127.0.0.1/tcp/45655/p2p/QmXTwd6AFWBDCvrcy86fge6HxNKgH2vPmrrjFTNTKQihwe`.

4. Start other peers
```bash
npm run peer <peer_username> <bootstrap_peer_address>
```

5. Open the testapp to interact with a peer. Each peer will print a message like this:
```
============================================================

[INTERFACE] Peer interface listening on http://localhost:37535
[INTERFACE] Test app on http://localhost:3000/?port=37535

============================================================
```

This link: http://localhost:3000/?port=37535 will direct you to the testapp (don't forget to have the testapp running - step 2)
