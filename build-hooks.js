// Deja también una copia con el nombre anterior para que el flujo de GitHub que ya tienes siga funcionando.
const fs = require('fs'), path = require('path');
exports.default = async function (ctx) {
  for (const f of ctx.artifactPaths || []) {
    if (/Cubo-Setup\.exe$/i.test(f)) fs.copyFileSync(f, path.join(path.dirname(f), 'Isla-Dinamica-Setup.exe'));
  }
  return [];
};
