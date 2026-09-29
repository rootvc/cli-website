/* Convert the existing local photos and logos into text once per image. */
window.rootAscii = (() => {
  const cache = new Map();
  const characters = "@%#*+=-:. ";

  function fromPixels(pixels, width, height) {
    const lines = [];
    for (let y = 0; y < height; y++) {
      let line = "";
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const alpha = pixels[i + 3] / 255;
        const light =
          (0.2126 * pixels[i] +
            0.7152 * pixels[i + 1] +
            0.0722 * pixels[i + 2]) *
            alpha +
          255 * (1 - alpha);
        line += characters[Math.round((light / 255) * (characters.length - 1))];
      }
      lines.push(line);
    }
    return lines.join("\n");
  }

  function load(src) {
    if (cache.has(src)) return cache.get(src);
    const result = new Promise((resolve, reject) => {
      const photo = new Image();
      photo.onload = () => {
        try {
          const width = 76;
          const height = Math.max(
            1,
            Math.min(
              60,
              Math.round(
                ((width * photo.naturalHeight) / photo.naturalWidth) * 0.48
              )
            )
          );
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          context.drawImage(photo, 0, 0, width, height);
          resolve(
            fromPixels(
              context.getImageData(0, 0, width, height).data,
              width,
              height
            )
          );
        } catch (error) {
          reject(error);
        }
      };
      photo.onerror = () => reject(new Error("Image unavailable"));
      photo.src = src;
    }).catch((error) => {
      cache.delete(src);
      throw error;
    });
    cache.set(src, result);
    return result;
  }
  return { load, fromPixels };
})();
