chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'font:GET_FONT_FILES') {
    fetchFontFilesFromCSS(request.cssUrl)
      .then(fonts => {
        sendResponse({ success: true, fonts })
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message })
      })
    return true
  }
})

async function fetchFontAsDataUrl(fontUrl) {
  try {
    const response = await fetch(fontUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error in fetchFontAsDataUrl:', error)
    throw error
  }
}

async function fetchFontCSS(cssUrl) {
  try {
    const response = await fetch(cssUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    console.error('Error in fetchFontCSS:', error)
    throw error
  }
}

async function fetchFontFilesFromCSS(cssUrl) {
  try {
    const fontCSSText = await fetchFontCSS(cssUrl)

    const fontUrls = extractUrls(fontCSSText)

    const fontData = await Promise.all(
      fontUrls.map(async url => {
        const dataUrl = await fetchFontAsDataUrl(url)
        return { url, dataUrl }
      }),
    )

    // Replace URLs in CSS with base64 data URL
    let modifiedCSS = fontCSSText

    fontData.forEach(({ url, dataUrl }) => {
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`url\\(['"]?${escapedUrl}['"]?\\)`, 'gi')
      modifiedCSS = modifiedCSS.replace(regex, `url('${dataUrl}')`)
    })

    return {
      css: modifiedCSS,
    }
  } catch (error) {
    console.error('Error in fetchFontFilesFromCSS:', error)
  }
}

const ALLOWED_SUBSETS = [
  'latin-ext',
  'latin',
  'cyrillic',
  'cyrillic-ext',
  'vietnamese',
  'greek',
  'arabic',
  'hebrew',
  'devanagari',
  'bengali',
  'thai',
  'chinese-simplified',
  'chinese-traditional',
  'japanese',
  'korean',
]

function extractUrls(text) {
  // Parse @font-face blocks
  const fontFaceRegex = /@font-face\s*\{[^}]+\}/g
  const fontFaces = text.match(fontFaceRegex) || []

  const subsetMap = new Map()

  for (const block of fontFaces) {
    // Extract comment above @font-face (subset name)
    const commentMatch = text
      .substring(Math.max(0, text.indexOf(block) - 100), text.indexOf(block))
      .match(/\/\*\s*([^*]+)\s*\*\//)

    const subset = commentMatch ? commentMatch[1].trim().toLowerCase() : null

    const urlMatch = block.match(/url\(([^)]+)\)/)
    const url = urlMatch ? urlMatch[1] : null

    if (subset && url && ALLOWED_SUBSETS.includes(subset)) {
      subsetMap.set(subset, url)
    }
  }

  const finalUrls = []

  if (subsetMap.has('cyrillic')) {
    finalUrls.push(subsetMap.get('cyrillic'))
    subsetMap.delete('cyrillic-ext')
  } else if (subsetMap.has('cyrillic-ext')) {
    finalUrls.push(subsetMap.get('cyrillic-ext'))
  }

  if (subsetMap.has('latin-ext')) {
    finalUrls.push(subsetMap.get('latin-ext'))
    subsetMap.delete('latin')
  } else if (subsetMap.has('latin')) {
    finalUrls.push(subsetMap.get('latin'))
  }

  if (subsetMap.has('greek')) {
    finalUrls.push(subsetMap.get('greek'))
  }

  for (const otherSubset of subsetMap) {
    const [subset, url] = otherSubset
    if (!['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext', 'greek'].includes(subset)) {
      finalUrls.push(url)
    }
  }

  return finalUrls
}
