const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const WATCH_DIR = path.join(__dirname, '..');
const DEBOUNCE_MS = 5000; // Esperar 5 segundos después del último guardado para agrupar cambios
const IGNORED_PATHS = [
  '.git',
  '.next',
  'node_modules',
  '.vscode',
  'package-lock.json',
  'studio.json'
];

let timeoutId = null;
let changedFiles = new Set();

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: WATCH_DIR }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function handlePush() {
  const filesList = Array.from(changedFiles);
  console.log(`\n[AutoPush] ${new Date().toLocaleTimeString()} - Cambios detectados en: ${filesList.join(', ')}`);
  changedFiles.clear();
  
  try {
    // 1. Verificar si hay un repositorio remoto configurado
    try {
      const { stdout: remoteOut } = await runCommand('git remote');
      if (!remoteOut.trim().includes('origin')) {
        console.warn('[AutoPush] [ADVERTENCIA] No hay un repositorio remoto "origin" configurado.');
        console.warn('[AutoPush] Para configurar uno, ejecuta en tu consola:\n  git remote add origin URL_DE_TU_REPOSITORIO\n');
        return;
      }
    } catch (e) {
      console.error('[AutoPush] Error al comprobar remotos de Git:', e.message);
      return;
    }

    // 2. Ejecutar Git Add
    console.log('[AutoPush] Agregando archivos...');
    await runCommand('git add .');
    
    // 3. Verificar si hay cambios reales en el staging
    const { stdout: statusOut } = await runCommand('git status --porcelain');
    if (!statusOut.trim()) {
      console.log('[AutoPush] No hay cambios pendientes de comitear.');
      return;
    }

    // 4. Obtener la rama actual
    let branch = 'master';
    try {
      const { stdout: branchOut } = await runCommand('git branch --show-current');
      if (branchOut.trim()) {
        branch = branchOut.trim();
      }
    } catch (e) {
      // Ignorar e intentar con master
    }

    // 5. Ejecutar Git Commit
    const commitMessage = `Auto-commit: ${new Date().toLocaleString()}`;
    console.log(`[AutoPush] Creando commit: "${commitMessage}"`);
    await runCommand(`git commit -m "${commitMessage}"`);

    // 6. Ejecutar Git Push
    console.log(`[AutoPush] Subiendo a GitHub (rama: ${branch})...`);
    const { stdout: pushOut, stderr: pushErr } = await runCommand(`git push origin ${branch}`);
    console.log('[AutoPush] ¡Subida exitosa!');
    if (pushOut.trim()) console.log(pushOut);
  } catch (error) {
    console.error('[AutoPush] [ERROR] Ocurrió un fallo en Git:', error.message);
  }
}

function watchDirectory(dir) {
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Verificar si el archivo está en rutas ignoradas
    const isIgnored = IGNORED_PATHS.some(ignored => {
      const parts = filename.split(path.sep);
      return parts.includes(ignored);
    });

    if (isIgnored) return;

    changedFiles.add(filename);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      handlePush();
    }, DEBOUNCE_MS);
  });
  
  console.log('==================================================');
  console.log(`[AutoPush] Iniciado. Vigilando cambios en: ${dir}`);
  console.log('==================================================');
}

// Iniciar vigilancia
watchDirectory(WATCH_DIR);
