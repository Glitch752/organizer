import { Server } from '@hocuspocus/server'
import { SQLite } from '@hocuspocus/extension-sqlite'

const server = new Server({
    port: 3000,
    
    async onConnect() {
        console.log("Server listening on port 3000")
    },
    
    extensions: [
        new SQLite({
            database: 'db.sqlite',
        }),
    ],
});

server.listen();