const fs = require("fs");
let code = fs.readFileSync("App.tsx", "utf8");

code = code.replace("import { AuthProvider } from \"./providers/AuthProvider\";", "import { AuthProvider } from \"./providers/AuthProvider\";\nimport { ThemeProvider } from \"./providers/ThemeContext\";");

code = code.replace("<AuthProvider>", "<ThemeProvider><AuthProvider>");
code = code.replace("</AuthProvider>", "</AuthProvider></ThemeProvider>");

fs.writeFileSync("App.tsx", code);
console.log("Updated App.tsx");

