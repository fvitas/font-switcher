import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/ui/motion-tabs.jsx'
import { googleFonts } from '@/google-fonts.js'
import { isEmpty } from 'lodash'
import { SearchIcon, SlidersHorizontalIcon, Upload, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { twMerge } from 'tailwind-merge'

const popularSystemFonts = [
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, sans-serif' },
  { name: 'Verdana', family: 'Verdana, sans-serif' },
  { name: 'Tahoma', family: 'Tahoma, sans-serif' },
  { name: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif' },
  { name: 'Impact', family: 'Impact, sans-serif' },
  { name: 'Times New Roman', family: 'Times New Roman, serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Palatino', family: 'Palatino, serif' },
  { name: 'Courier New', family: 'Courier New, monospace' },
  { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive' },
]
const systemFonts = await chrome?.fontSettings?.getFontList()

const tabs = [
  {
    name: 'System Fonts',
    value: 'system',
    fonts: [
      ...popularSystemFonts,
      ...systemFonts
        .map(font => ({ name: font.fontId, family: font.fontId }))
        .filter(font => !popularSystemFonts.find(pf => pf.name === font.name)),
    ],
  },
  {
    name: 'Google Fonts',
    value: 'google',
    fonts: googleFonts,
  },
  {
    name: 'Custom Fonts',
    value: 'custom',
  },
]

function loadGoogleFont(fontFamily) {
  const googleFontId = `google-font-${fontFamily}`
  const fontLinkExists = document.getElementById(googleFontId)

  if (fontLinkExists) {
    return
  }

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.id = googleFontId
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap`
  document.head.appendChild(link)
}

function FontButton({ font, fontType, isSelected, onPointerDown, onKeyDown }) {
  useEffect(() => {
    if (fontType === 'google') {
      loadGoogleFont(font.family)
    }
  }, [])

  return (
    <Button
      key={font.name}
      variant="ghost"
      size="icon"
      className={twMerge(
        'text-foreground hover:bg-primary/30 my-0.5 w-full cursor-pointer justify-start rounded-md p-4 text-left transition-colors',
        isSelected && 'bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground',
      )}
      style={{ fontFamily: font.family }}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}>
      <span className="text-lg">{font.name}</span>
    </Button>
  )
}

export function App() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('system')
  const [customFonts, setCustomFonts] = useState([])
  const [fontUrl, setFontUrl] = useState('')
  const [fontName, setFontName] = useState('')
  const [selectedFont, setSelectedFont] = useState(null)

  function handleFileUpload(event) {
    const file = event.target.files?.[0]
    if (file && fontName) {
      const url = URL.createObjectURL(file)
      const newFont = {
        name: fontName,
        family: fontName,
        file,
        url,
      }
      setCustomFonts([...customFonts, newFont])
      setFontName('')
      event.target.value = ''
    }
  }

  function handleAddFontUrl() {
    if (fontUrl && fontName) {
      const newFont = {
        name: fontName,
        family: fontName,
        url: fontUrl,
      }
      setCustomFonts([...customFonts, newFont])
      setFontUrl('')
      setFontName('')
    }
  }

  async function selectFont(font, type) {
    setSelectedFont(font)

    // TODO (filipv): split and refactor this logic
    if (type === 'system') {
      const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })

      if (!tab) {
        return
      }
      await chrome?.scripting?.executeScript({
        target: { tabId: tab.id },
        func: fontFamily => {
          const style = document.createElement('style')
          style.id = 'custom-font-override'
          style.textContent = `
            * {
              font-family: ${fontFamily} !important;
            }
            
            p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th, label, button, input, textarea, select {
              font-family: ${fontFamily} !important;
            }
          `
          document.head.appendChild(style)
        },
        args: [font.family],
      })
      return
    }

    if (type === 'google') {
      const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })

      if (!tab) {
        return
      }

      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}&display=swap`

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: fontFamily => {
            const styleId = `font-face-injection-${fontFamily.replace(/\s+/g, '-')}`
            const styleElement = document.getElementById(styleId)
            return styleElement !== null
          },
          args: [font.family],
        })

        const fontStyleExists = results[0].result

        if (fontStyleExists) {
          await chrome?.scripting?.executeScript({
            target: { tabId: tab.id },
            func: applyFont,
            args: [font.family],
          })
          return
        }

        const response = await chrome.runtime.sendMessage({
          action: 'font:GET_FONT_FILES',
          cssUrl: fontUrl,
        })

        if (!response.success) {
          // show notifications
          throw new Error(response.error || 'Failed to fetch font files')
        }

        function injectFont(fontFamily, fontCss) {
          let style = document.createElement('style')
          style.id = `font-face-injection-${fontFamily.replace(/\s+/g, '-')}`
          style.textContent = fontCss
          document.head.appendChild(style)
        }

        function applyFont(fontFamily) {
          const existingElement = document.getElementById('custom-font-override')
          if (existingElement) {
            existingElement.remove()
          }

          const style = document.createElement('style')
          style.id = 'custom-font-override'
          style.textContent = `
          * {
            font-family: ${fontFamily} !important;
          }
          
          p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th, label, button, input, textarea, select {
            font-family: ${fontFamily} !important;
          }
        `
          document.head.appendChild(style)
        }

        await chrome?.scripting?.executeScript({
          target: { tabId: tab.id },
          func: injectFont,
          args: [font.family, response.fonts.css],
        })
        await chrome?.scripting?.executeScript({
          target: { tabId: tab.id },
          func: applyFont,
          args: [font.family],
        })
      } catch (error) {
        console.error('Error injecting font:', error)
        // add notification for error
      }
    }
  }

  return (
    <div className="bg-card text-card-foreground m-0 flex w-96 flex-col gap-4 p-6 py-6">
      {/*<div className="flex items-center justify-between">*/}
      {/*  <img src="/favicon/logo.svg" alt="Font Swapper logo" className="w-8" />*/}

      {/*  <h2 className="font-[Bonheur_Royale] text-5xl leading-none">Font Switcher</h2>*/}

      {/*  <Button variant="ghost" size="icon" onClick={() => window.close()}>*/}
      {/*    <XIcon />*/}
      {/*  </Button>*/}
      {/*</div>*/}

      <div className="flex gap-2">
        <img src="/favicon/logo.svg" alt="Font Swapper logo" className="mr-2 w-8" />

        <div className="relative">
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
            <SearchIcon className="size-4" />
            <span className="sr-only">Search</span>
          </div>

          <div className="flex gap-2">
            <Input
              id="search"
              name="search"
              type="search"
              placeholder="Search..."
              className="peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Button variant="ghost" size="icon">
              <SlidersHorizontalIcon />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={() => window.close()}>
          <XIcon />
        </Button>
      </div>

      <Tabs defaultValue="system" className="gap-4" onValueChange={setActiveTab}>
        <TabsList className="w-full">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContents className="bg-background h-full">
          {tabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="h-[300px] overflow-auto">
              {isEmpty(tab.fonts) ? (
                <div className="text-muted-foreground py-8 text-center">No fonts found</div>
              ) : (
                <Virtuoso
                  style={{ height: '100%' }}
                  data={tab?.fonts}
                  itemContent={(index, font) => (
                    <FontButton
                      key={'font-button-' + index}
                      font={font}
                      fontType={tab.value}
                      isSelected={selectedFont?.name === font.name}
                      onPointerDown={event => {
                        if (event.button === 0) {
                          selectFont(font, tab.value)
                        }
                      }}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          selectFont(font, tab.value)
                        }
                      }}
                    />
                  )}
                />
              )}
            </TabsContent>
          ))}
        </TabsContents>
      </Tabs>

      {activeTab === 'custom' && (
        <div className="border-border mb-4 space-y-3 rounded-md border p-4">
          <Input type="text" placeholder="Font name" value={fontName} onChange={e => setFontName(e.target.value)} />
          <div className="space-y-2">
            <Input type="text" placeholder="Font URL" value={fontUrl} onChange={e => setFontUrl(e.target.value)} />
            <Button onClick={handleAddFontUrl} className="w-full" disabled={!fontName || !fontUrl}>
              Add from URL
            </Button>
          </div>
          <div className="relative">
            <Input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFileUpload}
              disabled={!fontName}
              className="cursor-pointer"
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <Upload className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      {/*<div className="max-h-[400px] space-y-2 overflow-y-auto">*/}
      {/*  {filteredFonts.map(font => (*/}
      {/*    <button*/}
      {/*      key={font.name}*/}
      {/*      className="border-border hover:border-foreground w-full rounded-md border px-4 py-3 text-left transition-colors"*/}
      {/*      style={{ fontFamily: font.family }}>*/}
      {/*      <span className="text-lg">{font.name}</span>*/}
      {/*    </button>*/}
      {/*  ))}*/}
      {/*  {activeTab === 'custom' && filteredFonts.length === 0 && (*/}
      {/*    <div className="text-muted-foreground py-8 text-center">No custom fonts added yet</div>*/}
      {/*  )}*/}
      {/*</div>*/}
    </div>
  )
}
