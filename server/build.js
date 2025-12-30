import esbuild from "esbuild";
import { copyFileSync, mkdirSync, writeFileSync } from "fs";

console.log("Building server...");

await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: "dist/index.js",
    sourcemap: true,
    minify: false,
    external: ["ws"]
}).catch(() => process.exit(1));

// Also copy node_sqlite3.node to dist/build.
// This is super hacky, but whatever
const srcBinding = "./node_modules/better-sqlite3/build/Release/better_sqlite3.node";
mkdirSync("./dist/build", { recursive: true });
copyFileSync(srcBinding, "./dist/build/better_sqlite3.node");

// Add an empty package.json because sqlite3 looks for it to find the bindings lol
writeFileSync("./dist/package.json", "{}");
// Create a start file
writeFileSync("./dist/start.sh", `#!/bin/bash\ncd $(dirname "$0")\nnode index.js\n`);

console.log("Server build complete.");