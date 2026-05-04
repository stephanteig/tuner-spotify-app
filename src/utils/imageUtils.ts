const MAX_BYTES = 200_000 // Spotify limit is 256KB base64; stay comfortably under

export function compressImageToJpegBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')

      // Scale down so the image isn't unnecessarily large
      let { width, height } = img
      const maxDim = 800
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim }
        else { width = Math.round((width / height) * maxDim); height = maxDim }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // Try progressively lower quality until it fits
      let quality = 0.85
      let base64 = ''
      while (quality >= 0.3) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        base64 = dataUrl.split(',')[1]
        if (base64.length <= MAX_BYTES) break
        quality -= 0.1
      }

      if (base64.length > MAX_BYTES) {
        reject(new Error('Image is too large. Try a smaller file.'))
      } else {
        resolve(base64)
      }
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}
