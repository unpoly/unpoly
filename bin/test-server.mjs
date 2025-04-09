import { startServer, serverURL } from '../spec/runner/server.mjs'
import pc from "picocolors"

await startServer()

console.log(pc.blue(`Unpoly specs serving on ${serverURL}. Press CTRL+C to quit.`))
