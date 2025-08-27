export async function loadGoogleFont(font: string, text: string) {
    const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`
    const css = await (await fetch(url)).text()
    const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

    if (resource) {
        const response = await fetch(resource[1])
        if (response.status == 200) {
            return await response.arrayBuffer()
        }
    }

    throw new Error('failed to load font data')
}

export async function loadGeistFonts(text: string) {
    // Load Geist with different weights
    const [geistMedium, geistSemiBold] = await Promise.all([
        loadGoogleFont('Geist:wght@400;500', text),
        loadGoogleFont('Geist:wght@600;700', text)
    ])
    
    return { geistMedium, geistSemiBold }
}