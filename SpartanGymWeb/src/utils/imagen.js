const leerArchivoComoDataUrl = (archivo) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = rechazar;
    lector.readAsDataURL(archivo);
  });

const cargarImagen = (src) =>
  new Promise((resolver, rechazar) => {
    const imagen = new window.Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = rechazar;
    imagen.src = src;
  });

export const prepararImagen = async (
  archivo,
  { maxLado = 720, calidad = 0.86, maxBytesEntrada = 3 * 1024 * 1024 } = {}
) => {
  if (!archivo?.type?.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen valido.');
  }
  if (archivo.size > maxBytesEntrada) {
    const mb = Math.round(maxBytesEntrada / (1024 * 1024));
    throw new Error(`La imagen no debe superar ${mb} MB.`);
  }

  const dataUrl = await leerArchivoComoDataUrl(archivo);
  if (archivo.type === 'image/svg+xml' || typeof document === 'undefined') {
    return dataUrl;
  }

  const imagen = await cargarImagen(dataUrl);
  const escala = Math.min(1, maxLado / imagen.width, maxLado / imagen.height);
  const ancho = Math.max(1, Math.round(imagen.width * escala));
  const alto = Math.max(1, Math.round(imagen.height * escala));
  const canvas = document.createElement('canvas');
  const contexto = canvas.getContext('2d');
  canvas.width = ancho;
  canvas.height = alto;
  contexto.drawImage(imagen, 0, 0, ancho, alto);

  return canvas.toDataURL('image/webp', calidad);
};
