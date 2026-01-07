import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/ui/motion-tabs.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { googleFonts } from '@/google-fonts.js'
import Fuse from 'fuse.js'
import { isEmpty } from 'lodash'
import {
  BugIcon,
  CaseSensitiveIcon,
  CoffeeIcon,
  ExternalLinkIcon,
  InfoIcon,
  MoonIcon,
  MoreVerticalIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  SunIcon,
  Upload,
  XIcon,
} from 'lucide-react'
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
    name: 'Custom Fonts',
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

function highlightText(match) {
  let result = []
  let lastIndex = 0

  match.indices.forEach(([startIdx, endIdx]) => {
    // Add text before the match
    if (startIdx > lastIndex) {
      result.push(match.value.substring(lastIndex, startIdx))
    }

    // Add the highlighted match
    result.push(
      <spans key={`highlight-${startIdx}`} className="bg-primary/50">
        {match.value.substring(startIdx, endIdx + 1)}
      </spans>,
    )

    lastIndex = endIdx + 1
  })

  // Add any remaining text after the last match
  if (lastIndex < match.value.length) {
    result.push(match.value.substring(lastIndex))
  }

  return result
}

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

function FontButton({ font, fontType, isSelected, searchMatch, onPointerDown, onKeyDown }) {
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
        'text-foreground hover:bg-primary/30 dark:hover:bg-primary/50 my-0.5 w-full cursor-pointer justify-start rounded-md p-4 text-left transition-colors',
        isSelected &&
          'bg-primary hover:bg-primary dark:hover:bg-primary text-primary-foreground hover:text-primary-foreground',
      )}
      style={{ fontFamily: font.family }}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}>
      <span className="text-lg">{searchMatch ? highlightText(searchMatch) : font.name}</span>
    </Button>
  )
}

export function AppMenu() {
  const [theme, setTheme] = useState('light')
  const [aboutOpen, setAboutOpen] = useState(false)

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark')
  }

  function handleCloseApp() {
    window.close()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVerticalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
            {theme === 'light' ? (
              <>
                <MoonIcon className="size-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <SunIcon className="size-4" />
                <span>Light Mode</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setAboutOpen(true)} className="cursor-pointer">
            <InfoIcon className="size-4" />
            <span>About</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() =>
              window.open('https://github.com/fvitas/font-switcher/issues/new?template=%F0%9F%9A%80-feature-request.md')
            }>
            <SparklesIcon className="size-4" />
            <span>Request a feature</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() =>
              window.open('https://github.com/fvitas/font-switcher/issues/new?template=%F0%9F%90%9B-bug-report.md')
            }>
            <BugIcon className="size-4" />
            <span>Report a bug</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer">
            <a
              href=""
              className="flex items-center gap-2"
              onClick={() => window.open('https://www.buymeacoffee.com/filipvitas')}>
              <CoffeeIcon className="size-4" />
              <span>Buy me a coffee / Donate</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleCloseApp}
            className="focus:bg-destructive/10 dark:focus:bg-destructive/30 cursor-pointer">
            <XIcon className="size-4" />
            <span>Close extension</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* About Modal */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Font Switcher</DialogTitle>
            <DialogDescription>Free · Open Source</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Version</span>
              <span>1.0.0</span>
            </div>

            <div className="flex justify-between">
              <span>Developed by</span>
              <a
                href="https://x.com/vitasdev"
                rel="noreferrer"
                target="_blank"
                className="flex items-center gap-1 transition hover:opacity-75">
                Filip Vitas
                <ExternalLinkIcon className="size-4" />
              </a>
            </div>

            <div className="flex justify-between">
              <span>Source code</span>
              <span>
                <a
                  href="https://github.com/fvitas/font-switcher"
                  rel="noreferrer"
                  target="_blank"
                  className="flex items-center gap-1 transition hover:opacity-75">
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="size-4">
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span>GitHub</span>
                  <ExternalLinkIcon className="size-4" />
                </a>
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function FontSettingsDialog() {
  // TODO (filipv): get values from the page
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [wordSpacing, setWordSpacing] = useState(0)

  async function handleFontSizeChange(newFontSize) {
    setFontSize(newFontSize)

    const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fontSize => {
        const oldStyle = document.getElementById('custom-font-size-style')
        if (oldStyle) {
          oldStyle.remove()
        }

        const style = document.createElement('style')
        style.id = 'custom-font-size-style' // Give it a unique ID
        style.textContent = `
          body {
            font-size: ${fontSize}px !important;
          }
          body * {
            font-size: inherit !important;
          }
        `

        document.head.appendChild(style)
      },
      args: [newFontSize],
    })
  }

  async function handleLineHeightChange(newLineHeight) {
    setLineHeight(newLineHeight)

    const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: lineHeight => {
        const oldStyle = document.getElementById('custom-line-height-style')
        if (oldStyle) {
          oldStyle.remove()
        }

        const style = document.createElement('style')
        style.id = 'custom-line-height-style'
        style.textContent = `
          body {
            line-height: ${lineHeight} !important;
          }
          body * {
            line-height: inherit !important;
          }
        `
        document.head.appendChild(style)
      },
      args: [newLineHeight],
    })
  }

  async function handleWordSpacingChange(newWordSpacing) {
    setWordSpacing(newWordSpacing)

    const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: lineHeight => {
        const oldStyle = document.getElementById('custom-word-spacing-style')
        if (oldStyle) {
          oldStyle.remove()
        }

        const style = document.createElement('style')
        style.id = 'custom-word-spacing-style'
        style.textContent = `
          body {
            word-spacing: ${lineHeight} !important;
          }
          body * {
            word-spacing: inherit !important;
          }
        `
        document.head.appendChild(style)
      },
      args: [newWordSpacing],
    })
  }

  async function handleFontReset() {
    setFontSize(16)
    setLineHeight(1.5)
    setWordSpacing(0)

    const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        document.getElementById('custom-font-size-style')?.remove()
        document.getElementById('custom-line-height-style')?.remove()
        document.getElementById('custom-word-spacing-style')?.remove()
      },
    })
  }

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <CaseSensitiveIcon className="size-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="w-[350px]" showCloseButton={false}>
          <DialogHeader className="text-left">
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name-1">Font size</Label>
              <div className="flex gap-2">
                <Slider
                  min={10}
                  max={40}
                  step={1}
                  value={[fontSize]}
                  onValueChange={([value]) => handleFontSizeChange(value)}
                />
                <Input
                  id="name-1"
                  name="name"
                  type="number"
                  className="w-16"
                  value={fontSize}
                  min={10}
                  max={40}
                  onChange={event => handleFontSizeChange(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name-2">Line height</Label>
              <div className="flex gap-2">
                <Slider
                  min={0}
                  max={3}
                  step={0.1}
                  value={[lineHeight]}
                  onValueChange={([value]) => handleLineHeightChange(value)}
                />
                <Input
                  id="name-2"
                  name="name"
                  type="number"
                  value={lineHeight}
                  className="w-16"
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={event => handleLineHeightChange(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name-3">Word spacing</Label>
              <div className="flex gap-2">
                <Slider
                  min={-2}
                  max={4}
                  step={0.1}
                  defaultValue={[wordSpacing]}
                  value={[wordSpacing]}
                  onValueChange={([value]) => handleWordSpacingChange(value)}
                />
                <Input
                  id="name-3"
                  name="name"
                  type="number"
                  value={wordSpacing}
                  className="w-16"
                  min={-2}
                  max={4}
                  step={0.1}
                  onChange={event => handleWordSpacingChange(Number(event.target.value))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={handleFontReset}>
                Reset font settings
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export function App() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('system')
  const [customFonts, setCustomFonts] = useState([])
  const [fontUrl, setFontUrl] = useState('')
  const [fontName, setFontName] = useState('')
  const [selectedFont, setSelectedFont] = useState(null)

  let results = []
  if (search.length >= 2) {
    results = fuse.search(search)
  }

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

  async function selectFont(font, type = 'system') {
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
    <div className="bg-card text-card-foreground m-0 flex w-96 flex-col gap-4 p-4">
      {/*<div className="flex items-center justify-between">*/}
      {/*  <img src="/favicon/logo.svg" alt="Font Swapper logo" className="w-8" />*/}

      {/*  <h2 className="font-[Bonheur_Royale] text-5xl leading-none">Font Switcher</h2>*/}

      {/*  <Button variant="ghost" size="icon" onClick={() => window.close()}>*/}
      {/*    <XIcon />*/}
      {/*  </Button>*/}
      {/*</div>*/}

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
                className="absolute inset-y-0.5 right-0.5 flex items-center justify-center peer-disabled:opacity-50">
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
                      selectFont(result.item)
                    }
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectFont(result.item)
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
                {!isEmpty(tab.fonts) && (
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
      )}

      {activeTab === 'custom' && (
        <>
          {/*<Card*/}
          {/*  className={`relative cursor-pointer border-2 border-dashed transition-colors ${*/}
          {/*    isDragging ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'*/}
          {/*  }`}*/}
          {/*  onDragOver={handleDragOver}*/}
          {/*  onDragLeave={handleDragLeave}*/}
          {/*  onDrop={handleDrop}*/}
          {/*  onClick={handleClick}>*/}
          {/*  <div className="flex flex-col items-center justify-center px-6 py-20">*/}
          {/*    <div*/}
          {/*      className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${*/}
          {/*        isDragging ? 'bg-primary/20' : 'bg-muted'*/}
          {/*      }`}>*/}
          {/*      <UploadI className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />*/}
          {/*    </div>*/}

          {/*    <h3 className="text-foreground mb-2 text-lg font-medium">*/}
          {/*      {isDragging ? 'Drop files here' : 'Drag & drop files here'}*/}
          {/*    </h3>*/}
          {/*    <p className="text-muted-foreground mb-4 text-sm">or click to browse from your computer</p>*/}

          {/*    <Button variant="secondary" size="sm" type="button">*/}
          {/*      Choose Files*/}
          {/*    </Button>*/}
          {/*  </div>*/}

          {/*  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} />*/}
          {/*</Card>*/}

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
                <Upload className="size-4" />
              </div>
            </div>
          </div>

          <Card
            className={`relative cursor-pointer border-2 border-dashed transition-colors ${
              false ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'
            }`}
            onDragOver={() => {}}
            onDragLeave={() => {}}
            onDrop={() => {}}
            onClick={() => {}}>
            <div className="flex items-center justify-center gap-3 px-6 py-6">
              <Upload className={`h-5 w-5 ${false ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-foreground text-sm font-medium">
                {false ? 'Drop more files here' : 'Drop more files or click to browse'}
              </p>
            </div>

            <input ref={null} type="file" multiple className="hidden" onChange={() => {}} />
          </Card>
        </>
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
