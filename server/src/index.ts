import { Server } from '@hocuspocus/server'
import { SQLite } from '@hocuspocus/extension-sqlite'

const server = new Server({
    port: 3000,
    
    async onConnect() {
        console.log("Client connected")
    },
    
    extensions: [
        new SQLite({
            database: 'db.sqlite',
        }),
    ],
});

server.listen();