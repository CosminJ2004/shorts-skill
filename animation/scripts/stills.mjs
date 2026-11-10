// usage: node scripts/stills.mjs <outPrefix> <frame,frame,...> [scale]   (bundles once, GPU via ANGLE, jpeg)
// env: COMP=<composition id> (default PyramidShort), PROPS='{"post":{"ink":false}}' (inputProps for A/B tests),
//      GL=angle|vulkan|swangle, REMOTION_TMP=<folder> (Remotion copies bundles to the temp folder).
// Adapted from the cartoon-3d-short skill's bridge-stills.mjs.
import fs from "node:fs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
const id = process.env.COMP || "PyramidShort";
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const browserExecutable = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: process.env.GL || "angle" };
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions, inputProps });
const onBrowserLog = (l) => {
  if (process.env.LOGALL || ((l.type === "error" || l.type === "warning") && !l.text.includes("404"))) console.log(`[${l.type}]`, l.text.slice(0, 400));
};
fs.mkdirSync(path.dirname(prefix), { recursive: true });
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88,
    scale: Number(scale), browserExecutable, chromiumOptions, inputProps, timeoutInMilliseconds: 240000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
