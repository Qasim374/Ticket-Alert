// Wraps a marked-generated HTML body in a clean, print-friendly page.
// Usage: node wrap-html.js <bodyHtmlPath> <title> <outHtmlPath>
const fs = require("fs");
const [, , bodyPath, title, outPath] = process.argv;
const body = fs.readFileSync(bodyPath, "utf8");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, Arial, sans-serif; color: #1a2b22;
         line-height: 1.55; font-size: 12px; max-width: 100%; }
  h1 { font-size: 24px; color: #0b6b43; border-bottom: 3px solid #18a564;
       padding-bottom: 6px; margin-top: 0; }
  h2 { font-size: 17px; color: #0b6b43; margin-top: 22px;
       border-bottom: 1px solid #d6eadf; padding-bottom: 3px; }
  h3 { font-size: 14px; color: #14523a; }
  blockquote { background: #eafaf1; border-left: 4px solid #18a564;
               margin: 12px 0; padding: 8px 14px; border-radius: 4px; }
  code { background: #eef3f0; padding: 1px 5px; border-radius: 4px;
         font-family: Consolas, monospace; font-size: 11px; }
  pre { background: #0f241b; color: #d7ffe9; padding: 12px 14px;
        border-radius: 8px; overflow-x: auto; font-size: 10.5px; }
  pre code { background: transparent; color: inherit; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 11px; }
  th, td { border: 1px solid #c8ddd2; padding: 6px 9px; text-align: left;
           vertical-align: top; }
  th { background: #18a564; color: #fff; }
  tr:nth-child(even) td { background: #f4faf7; }
  a { color: #0b6b43; }
  ul, ol { padding-left: 20px; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px solid #d6eadf; margin: 18px 0; }
</style></head>
<body>${body}</body></html>`;

fs.writeFileSync(outPath, html);
console.log("wrote", outPath);
