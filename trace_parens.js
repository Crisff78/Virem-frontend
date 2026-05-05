const fs = require('fs');

function traceParens(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let stack = [];
    const lines = content.split('\n');
    for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '(') {
                stack.push({ line: l + 1, char: i + 1 });
            } else if (line[i] === ')') {
                if (stack.length === 0) {
                    console.log(`Extra ) at line ${l + 1}, char ${i + 1}`);
                } else {
                    stack.pop();
                }
            }
        }
    }
    stack.forEach(s => console.log(`Unmatched ( at line ${s.line}, char ${s.char}`));
}

traceParens('c:/Users/USER/OneDrive/Documentos/Proyectos/frontend/MedicoHorariosScreen.tsx');
