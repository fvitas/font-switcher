import { AppMenu } from '@/AppMenu.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/ui/motion-tabs.jsx'
import { FontButton } from '@/FontButton.jsx'
import { FontSettingsDialog } from '@/FontSettingsDialog.jsx'
import { googleFonts } from '@/google-fonts.js'
import Fuse from 'fuse.js'
import { isEmpty } from 'lodash'
import { FileTypeIcon, SearchIcon, SlidersHorizontalIcon, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
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

// TODO (filipv): check for duplicates in fonts
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
    name: 'Custom Font',
    value: 'custom',
  },
]

const fuse = new Fuse([...tabs.flatMap(tab => tab.fonts)], {
  keys: ['name'],
  threshold: 0.3,
  minMatchCharLength: 2,
  includeMatches: true,
  includeScore: true,
  isCaseSensitive: false,
})

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

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function CustomFontRenderer({ selectedFont }) {
  const fileInputRef = useRef(null)

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)

  useEffect(() => {
    setUploadedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [selectedFont])

  useEffect(() => {
    // TODO (filipv): move it into separate func out of useeffect
    async function loadFontFile() {
      const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
      if (!tab) {
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(uploadedFile)

      reader.onload = async function (event) {
        const fontName = uploadedFile.name.split('.').at(0)
        const fontCss = `
          @font-face {
            font-family: ${fontName};
            src: url('${event.target.result}');
          }
        `
        // TODO (filipv): check if exits before injection
        await chrome?.scripting?.executeScript({
          target: { tabId: tab.id },
          func: injectFont,
          args: [fontName, fontCss],
        })
        await chrome?.scripting?.executeScript({
          target: { tabId: tab.id },
          func: applyFont,
          args: [fontName],
        })
      }
    }
    if (uploadedFile) {
      loadFontFile()
    }
  }, [uploadedFile])

  const handleDragOver = useCallback(event => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(event => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(event.dataTransfer.files)
    // TODO (filipv): verify font
    if (!isEmpty(droppedFiles)) {
      setUploadedFile(droppedFiles.at(0))
    }
  }

  function handleFileInput(event) {
    const selectedFiles = Array.from(event.target.files || [])
    // TODO (filipv): verify font

    if (!isEmpty(selectedFiles)) {
      setUploadedFile(selectedFiles.at(0))
    }
  }

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <Card
      className={`relative cursor-pointer border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}>
      <div className="flex flex-col items-center justify-center">
        <div
          className={twMerge(
            'bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md transition-colors',
            isDragging && 'bg-primary/10',
          )}>
          {uploadedFile ? (
            <FileTypeIcon className="text-muted-foreground h-4 w-4" />
          ) : (
            <Upload className="text-muted-foreground h-4 w-4" />
          )}
        </div>
        {uploadedFile ? (
          <>
            <p className="my-2 truncate text-sm font-medium text-wrap">{uploadedFile.name}</p>
            <p className="truncate text-sm font-medium text-wrap">{formatFileSize(uploadedFile.size)}</p>
            <p className="text-muted-foreground mt-4 text-xs text-wrap">Upload a new font to replace the current one</p>
          </>
        ) : (
          <>
            <p className="my-2 truncate text-sm font-medium text-wrap">Upload a font file</p>
            <p className="text-muted-foreground truncate text-xs text-wrap">Drag and drop or click to upload</p>
            <p className="text-muted-foreground text-xs text-wrap">OTF, TTF, WOFF and WOFF2</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".otf,.ttf,.woff,.woff2"
        onChange={handleFileInput}
      />
    </Card>
  )
}

function DynamicTabRenderer({ tab, selectedFont, onFontSelect }) {
  if (tab.value === 'custom') {
    return <CustomFontRenderer selectedFont={selectedFont} />
  }

  if (tab.value === 'system' || tab.value === 'google') {
    if (isEmpty(tab.fonts)) {
      return <div className="text-muted-foreground flex h-full items-center justify-center pb-10">No fonts loaded</div>
    }

    return (
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
                onFontSelect(font, tab.value)
              }
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onFontSelect(font, tab.value)
              }
            }}
          />
        )}
      />
    )
  }
}

export function App() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('system')
  const [selectedFont, setSelectedFont] = useState(null)

  let results = []
  if (search.length >= 2) {
    results = fuse.search(search)
  }

  async function handleSelectFont(font, fontType = 'system') {
    setSelectedFont(font)

    const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
    if (!tab) {
      return
    }

    if (fontType === 'system') {
      await chrome?.scripting?.executeScript({
        target: { tabId: tab.id },
        func: applyFont,
        args: [font.family],
      })
      return
    }

    if (fontType === 'google') {
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
    <div className="bg-card text-card-foreground m-0 flex w-96 flex-col gap-4 p-4">
      <div className="flex">
        <img src="/favicon/logo.svg" alt="Font Swapper logo" className="mr-4 w-8" />

        <div className="relative">
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
            <SearchIcon className="size-4" />
            <span className="sr-only">Search</span>
          </div>

          <div className="flex gap-2">
            <Input
              id="search"
              name="font-switcher-search"
              autocomplete="on"
              type="search"
              placeholder="Search..."
              className="peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/*<InputGroupButton variant="ghost" className="!pr-1.5 text-xs">*/}
              {/*  Search In... <ChevronDownIcon className="size-3" />*/}
              {/*</InputGroupButton>*/}
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute inset-y-0.5 right-0.5 flex items-center justify-center peer-disabled:opacity-50"
                disabled={activeTab !== 'google'}>
                <SlidersHorizontalIcon />
                <span className="sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="[--radius:0.95rem]">
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Sans</DropdownMenuItem>
              <DropdownMenuItem>Serif</DropdownMenuItem>
              <DropdownMenuItem>Slab</DropdownMenuItem>
              <DropdownMenuItem>Display</DropdownMenuItem>
              <DropdownMenuItem>Handwritten</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-4 flex gap-1">
          <FontSettingsDialog />
          <AppMenu />
        </div>
      </div>

      {search.length >= 2 ? (
        <div className="h-[300px] overflow-auto">
          {isEmpty(results) ? (
            <div className="text-muted-foreground flex h-full items-center justify-center pb-10">No fonts found</div>
          ) : (
            <Virtuoso
              style={{ height: '100%' }}
              data={results}
              itemContent={(index, result) => (
                <FontButton
                  key={'font-button-' + index}
                  font={result.item}
                  searchMatch={result?.matches?.at(0)}
                  isSelected={selectedFont?.name === result.item.name}
                  onPointerDown={event => {
                    if (event.button === 0) {
                      handleSelectFont(result.item)
                    }
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleSelectFont(result.item)
                    }
                  }}
                />
              )}
            />
          )}
        </div>
      ) : (
        <Tabs value={activeTab} className="gap-4" onValueChange={setActiveTab}>
          <TabsList className="w-full">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContents className="h-full">
            {tabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="h-[300px] overflow-auto">
                <DynamicTabRenderer tab={tab} selectedFont={selectedFont} onFontSelect={handleSelectFont} />
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>
      )}
    </div>
  )
}
