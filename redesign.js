const fs = require("fs");
const patientCode = fs.readFileSync("DashboardPacienteScreen.tsx", "utf8");
const medicoCode = fs.readFileSync("DashboardMedico_backup.tsx", "utf8");

// The goal is to create a new DashboardMedico.tsx
console.log("Patient size:", patientCode.length, "Medico size:", medicoCode.length);

