const fs = require('fs');

function countBraces(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    let openBraces = 0;
    let closeBraces = 0;
    let openParens = 0;
    let closeParens = 0;
    let openBrackets = 0;
    let closeBrackets = 0;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
        if (char === '(') openParens++;
        if (char === ')') closeParens++;
        if (char === '[') openBrackets++;
        if (char === ']') closeBrackets++;
    }

    console.log(`File: ${filePath}`);
    console.log(`Braces: { ${openBraces}, } ${closeBraces} (Diff: ${openBraces - closeBraces})`);
    console.log(`Parens: ( ${openParens}, ) ${closeParens} (Diff: ${openParens - closeParens})`);
    console.log(`Brackets: [ ${openBrackets}, ] ${closeBrackets} (Diff: ${openBrackets - closeBrackets})`);
}

const files = process.argv.slice(2);
if (files.length === 0) {
    countBraces('c:/Users/USER/OneDrive/Documentos/Proyectos/frontend/DashboardMedico.tsx');
    countBraces('c:/Users/USER/OneDrive/Documentos/Proyectos/frontend/MedicoHorariosScreen.tsx');
    countBraces('c:/Users/USER/OneDrive/Documentos/Proyectos/frontend/MedicoPerfilScreen.tsx');
} else {
    files.forEach(f => countBraces(f));
}
