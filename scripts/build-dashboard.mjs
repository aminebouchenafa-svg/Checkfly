// Assembles the editable CheckFly dashboard artifact from
// dashboard-artifact/*.html/css/js + a roster JSON snapshot (produced by
// `npm run export:roster`) into a single self-contained HTML file, ready to
// hand to the Artifact tool as the *body content* for a fresh publish.
//
// Usage: node scripts/build-dashboard.mjs <roster.json> <out.html>
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'dashboard-artifact');

const [, , rosterPath, outPath] = process.argv;
if (!rosterPath || !outPath) {
  console.error('Usage: node scripts/build-dashboard.mjs <roster.json> <out.html>');
  process.exit(1);
}

const css = readFileSync(path.join(SRC, 'dashboard.css'), 'utf8');
const headTemplate = readFileSync(path.join(SRC, 'head-template.html'), 'utf8');
const skeleton = readFileSync(path.join(SRC, 'skeleton-template.html'), 'utf8');
const appLogic = readFileSync(path.join(SRC, 'app-logic.js'), 'utf8');
const rosterJson = readFileSync(rosterPath, 'utf8');

function escapeForScriptTag(s) {
  return s.split('</script').join('<\\/script');
}

const docHead = headTemplate.replace('__CSS__', () => css);

// DOC_HEAD / BODY_SKELETON are static (no self-reference needed) — plain
// JSON-stringified string literals are safe here. app-logic.js reads its own
// running <script id="app-script"> text back from the DOM at runtime to
// reconstruct the app script for future saves, so no quine trickery needed.
const preamble =
  'const DOC_HEAD = ' + JSON.stringify(docHead) + ';\n' +
  'const BODY_SKELETON = ' + JSON.stringify(skeleton) + ';\n';

const fullScript = preamble + appLogic;
const scriptTag = '<script id="app-script">' + escapeForScriptTag(fullScript) + '</script>';
const dataTag = '<script id="roster-data" type="application/json">' + escapeForScriptTag(rosterJson) + '</script>';

// Body-only content for the Artifact tool's *first* publish (the tool wraps
// this with its own <!doctype>/<head> skeleton). All *subsequent* saves are
// republished directly by the page itself via claude.use("artifact"), which
// supplies its own complete document built from DOC_HEAD/BODY_SKELETON.
const initialBody =
  '<title>CheckFly 737NG</title>\n' +
  '<style>' + css + '</style>\n' +
  skeleton + '\n' +
  dataTag + '\n' +
  scriptTag + '\n';

writeFileSync(outPath, initialBody);
console.log('Built', outPath, '(' + initialBody.length + ' bytes)');
