import { MotionHighlight, MotionHighlightItem } from '@/components/ui/motion-highlight'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

const TabsContext = createContext(undefined)

function useTabs() {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider')
  }

  return context
}

function Tabs({ defaultValue, value, onValueChange, children, className, ...props }) {
  const [activeValue, setActiveValue] = useState(defaultValue ?? undefined)
  const triggersRef = useRef(new Map())
  const initialSet = useRef(false)
  const isControlled = value !== undefined

  useEffect(() => {
    if (!isControlled && activeValue === undefined && triggersRef.current.size > 0 && !initialSet.current) {
      const firstTab = Array.from(triggersRef.current.keys())[0]

      setActiveValue(firstTab)
      initialSet.current = true
    }
  }, [activeValue, isControlled])

  const registerTrigger = (value, node) => {
    if (node) {
      triggersRef.current.set(value, node)

      if (!isControlled && activeValue === undefined && !initialSet.current) {
        setActiveValue(value)
        initialSet.current = true
      }
    } else {
      triggersRef.current.delete(value)
    }
  }

  const handleValueChange = val => {
    if (!isControlled) setActiveValue(val)
    else onValueChange?.(val)
  }

  const handleKeyNavigation = direction => {
    const tabs = Array.from(triggersRef.current.keys())
    const currentIndex = tabs.indexOf(value ?? activeValue)

    if (currentIndex === -1) return

    let nextIndex
    if (direction === 'left') {
      nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
    } else {
      nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1
    }

    const nextValue = tabs[nextIndex]
    handleValueChange(nextValue)

    // Focus the next tab trigger
    const nextNode = triggersRef.current.get(nextValue)
    if (nextNode) {
      nextNode.focus()
    }
  }

  return (
    <TabsContext.Provider
      value={{
        activeValue: value ?? activeValue,
        handleValueChange,
        registerTrigger,
        handleKeyNavigation,
      }}>
      <div data-slot="tabs" className={cn('flex flex-col gap-2', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({
  children,
  className,
  activeClassName,
  transition = {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  },
  ...props
}) {
  const { activeValue } = useTabs()

  return (
    <MotionHighlight
      controlledItems
      className={cn('bg-background rounded-sm shadow-sm', activeClassName)}
      value={activeValue}
      transition={transition}>
      <div
        role="tablist"
        data-slot="tabs-list"
        className={cn(
          'bg-muted text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-lg p-[4px]',
          className,
        )}
        {...props}>
        {children}
      </div>
    </MotionHighlight>
  )
}

function TabsTrigger({ ref, value, children, className, ...props }) {
  const { activeValue, handleValueChange, registerTrigger, handleKeyNavigation } = useTabs()

  const localRef = useRef(null)

  useImperativeHandle(ref, () => localRef.current)

  useEffect(() => {
    registerTrigger(value, localRef.current)

    return () => registerTrigger(value, null)
  }, [value, registerTrigger])

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handleKeyNavigation('left')
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleKeyNavigation('right')
    }
  }

  return (
    <MotionHighlightItem value={value} className="size-full">
      <motion.button
        ref={localRef}
        data-slot="tabs-trigger"
        role="tab"
        onClick={() => handleValueChange(value)}
        onKeyDown={handleKeyDown}
        data-state={activeValue === value ? 'active' : 'inactive'}
        className={cn(
          'ring-offset-background focus-visible:ring-ring data-[state=active]:text-foreground z-[1] inline-flex size-full cursor-pointer items-center justify-center rounded-sm px-2 py-1 text-sm font-medium whitespace-nowrap transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        {...props}>
        {children}
      </motion.button>
    </MotionHighlightItem>
  )
}

function TabsContents({
  children,
  className,
  transition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    bounce: 0,
    restDelta: 0.01,
  },
  ...props
}) {
  const { activeValue } = useTabs()
  const childrenArray = Children.toArray(children)

  const activeIndex = childrenArray.findIndex(
    child =>
      isValidElement(child) &&
      typeof child.props === 'object' &&
      child.props !== null &&
      'value' in child.props &&
      child.props.value === activeValue,
  )

  return (
    <div data-slot="tabs-contents" className={cn('overflow-hidden', className)} {...props}>
      <motion.div className="-mx-2 flex" animate={{ x: activeIndex * -100 + '%' }} transition={transition}>
        {childrenArray.map((child, index) => (
          <div key={index} className="w-full shrink-0 px-2">
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function TabsContent({ children, value, className, ...props }) {
  const { activeValue } = useTabs()
  const isActive = activeValue === value

  return (
    <motion.div
      role="tabpanel"
      data-slot="tabs-content"
      className={cn('overflow-hidden', className)}
      initial={{ filter: 'blur(0px)' }}
      animate={{ filter: isActive ? 'blur(0px)' : 'blur(2px)' }}
      exit={{ filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}>
      {children}
    </motion.div>
  )
}

export { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger, useTabs }
