// Grabación de voz con el micrófono (MediaRecorder). Funciona en localhost o https.
// Si el navegador no lo permite, la práctica sigue sin grabar.
export const puedeGrabar = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

export async function grabar() {
  const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(flujo);
  const partes = [];
  rec.addEventListener('dataavailable', (e) => { if (e.data.size) partes.push(e.data); });
  rec.start();
  return {
    /** Detiene la grabación y devuelve la URL del audio (o null si no se grabó nada). */
    detener: () => new Promise((listo) => {
      if (rec.state === 'inactive') { flujo.getTracks().forEach((t) => t.stop()); listo(null); return; }
      rec.addEventListener('stop', () => {
        flujo.getTracks().forEach((t) => t.stop());
        listo(partes.length ? URL.createObjectURL(new Blob(partes, { type: rec.mimeType || 'audio/webm' })) : null);
      }, { once: true });
      rec.stop();
    }),
  };
}
