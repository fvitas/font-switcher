import { Button } from '@/components/ui/button.jsx'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { CaseSensitiveIcon } from 'lucide-react'
import { useState } from 'react'

export function FontSettingsDialog() {
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

            <DialogClose asChild>
              <Button>Apply changes</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
