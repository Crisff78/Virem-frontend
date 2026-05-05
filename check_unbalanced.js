const fs = require('fs');

function findUnbalanced(filePath, charOpen, charClose) {
    const content = fs.readFileSync(filePath, 'utf8');
    let stack = [];
    for (let i = 0; i < content.length; i++) {
        if (content[i] === charOpen) {
            stack.push({ char: charOpen, index: i, line: content.substring(0, i).split('\n').length });
        } else if (content[i] === charClose) {
            if (stack.length === 0) {
                console.log(`Extra ${charClose} at line ${content.substring(0, i).split('\n').length}`);
            } else {
                stack.pop();
            }
        }
    }
    stack.forEach(s => console.log(`Unmatched ${charOpen} at line ${s.line}`));
}

findUnbalanced('c:/Users/USER/OneDrive/Documentos/Proyectos/frontend/MedicoHorariosScreen.tsx', '(', ')');
findUnbalanced('c:/Users/USER/OneDrive/Documentos/Proyectos/frontend/DashboardMedico.tsx', '(', ')');
