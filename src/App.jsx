import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const PRICING_CONFIG = {
  blankPrices: {
    standard: { label: 'Standard T-Shirt', cost: 3.53 },
    soft: { label: 'Soft T-Shirt', cost: 4.39 },
    polo: { label: 'Polo', cost: 8.73 },
    hoodie: { label: 'Hoodie', cost: 13.59 },
  },
  quantityBreaks: [
    { value: '1-5', label: '1-5 pieces', multiplier: 2.22 },
    { value: '6-11', label: '6-11 pieces', multiplier: 2.22 },
    { value: '12-23', label: '12-23 pieces', multiplier: 2 },
    { value: '24-47', label: '24-47 pieces', multiplier: 1.77 },
    { value: '48-71', label: '48-71 pieces', multiplier: 1.64 },
    { value: '72+', label: '72+ pieces', multiplier: 1.51 },
  ],
  transferPrices: {
    leftBreast: { label: 'Left Breast', cost: 1.5 },
    fullFront: { label: 'Full Front', cost: 5 },
    fullBack: { label: 'Full Back', cost: 5 },
    sleeve: { label: 'Sleeve Print', cost: 1.5 },
  },
}

const DEFAULT_APPAREL = 'standard'
const ROCK_BOTTOM_UNIT_PRICE = 8.5
const ASSET_BASE_URL = import.meta.env.BASE_URL
const BRANDED_BACKGROUND_BASE_HUE = 220
const APP_VERSION = 'v28'

const getGarmentImagePrefix = (apparelType) => {
  if (apparelType === 'polo' || apparelType === 'hoodie') {
    return `${apparelType}-`
  }

  return ''
}

const SHIRT_COLORS = [
  {
    value: 'white',
    label: 'White',
    hex: '#f5f7fb',
  },
  {
    value: 'black',
    label: 'Black',
    hex: '#121826',
  },
  {
    value: 'navy',
    label: 'Navy',
    hex: '#1d3557',
  },
  {
    value: 'charcoal',
    label: 'Charcoal',
    hex: '#374151',
  },
  {
    value: 'heather',
    label: 'Heather',
    hex: '#a9b0ba',
  },
  {
    value: 'red',
    label: 'Red',
    hex: '#c0392b',
  },
  {
    value: 'forest',
    label: 'Forest',
    hex: '#1f6b52',
  },
  {
    value: 'royal',
    label: 'Royal',
    hex: '#1f5fbf',
  },
  {
    value: 'light-blue',
    label: 'Light Blue',
    hex: '#7db7dc',
  },
  {
    value: 'maroon',
    label: 'Maroon',
    hex: '#6a1f33',
  },
  {
    value: 'purple',
    label: 'Purple',
    hex: '#6f4aa2',
  },
  {
    value: 'orange',
    label: 'Orange',
    hex: '#dc6f2b',
  },
  {
    value: 'gold',
    label: 'Gold',
    hex: '#d7a436',
  },
]

const createDefaultForm = () => ({
  apparelType: DEFAULT_APPAREL,
  shirtColor: 'black',
  quantity: '24',
  quantityTier: '24-47',
  blankCost: PRICING_CONFIG.blankPrices[DEFAULT_APPAREL].cost.toFixed(2),
  transferPrices: {
    leftBreast: PRICING_CONFIG.transferPrices.leftBreast.cost.toFixed(2),
    fullFront: PRICING_CONFIG.transferPrices.fullFront.cost.toFixed(2),
    fullBack: PRICING_CONFIG.transferPrices.fullBack.cost.toFixed(2),
    sleeve: PRICING_CONFIG.transferPrices.sleeve.cost.toFixed(2),
  },
  printLocations: {
    leftBreast: false,
    fullFront: true,
    fullBack: false,
    leftSleeve: false,
    rightSleeve: false,
  },
})

const GARMENT_NOTES = {
  standard: 'Reliable everyday blank for straightforward crew orders.',
  soft: 'Softer hand-feel for retail-style shirts and premium teams.',
  polo: 'Polished option for staff uniforms, golf events, and front chest logos.',
  hoodie: 'Heavier cold-weather piece with room for front, back, and sleeve hits.',
}

const DEFAULT_GRAPHICS = {
  leftBreast: null,
  fullFront: null,
  fullBack: null,
  leftSleeve: null,
  rightSleeve: null,
}

const GRAPHIC_LAYOUTS = {
  leftBreast: {
    view: 'front',
    widthLabel: '4 in wide',
    width: 16,
    x: 62,
    y: 28,
    rotation: 0,
  },
  fullFront: {
    view: 'front',
    widthLabel: '11 in wide',
    width: 43,
    x: 49.5,
    y: 39.5,
    rotation: 0,
  },
  leftSleeve: {
    view: 'front',
    widthLabel: '4 in wide',
    width: 13,
    x: 18.5,
    y: 37.5,
    rotation: 45,
  },
  rightSleeve: {
    view: 'front',
    widthLabel: '4 in wide',
    width: 13,
    x: 81.5,
    y: 37.5,
    rotation: -45,
  },
  fullBack: {
    view: 'back',
    widthLabel: '11 in wide',
    width: 43,
    x: 49.5,
    y: 37.5,
    rotation: 0,
  },
}

const BACKGROUND_MATCH_THRESHOLD = 95
const BACKGROUND_MATCH_SOFTNESS = 60

const clampNumber = (value) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

const sanitizeIntegerInput = (value) => value.replace(/\D/g, '')

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : normalized

  const parsed = Number.parseInt(expanded, 16)

  if (!Number.isFinite(parsed)) {
    return { red: 94, green: 139, blue: 233 }
  }

  return {
    red: (parsed >> 16) & 255,
    green: (parsed >> 8) & 255,
    blue: parsed & 255,
  }
}

const rgbToHue = ({ red, green, blue }) => {
  const normalizedRed = red / 255
  const normalizedGreen = green / 255
  const normalizedBlue = blue / 255
  const max = Math.max(normalizedRed, normalizedGreen, normalizedBlue)
  const min = Math.min(normalizedRed, normalizedGreen, normalizedBlue)
  const delta = max - min

  if (delta === 0) {
    return 0
  }

  let hue

  if (max === normalizedRed) {
    hue = ((normalizedGreen - normalizedBlue) / delta) % 6
  } else if (max === normalizedGreen) {
    hue = (normalizedBlue - normalizedRed) / delta + 2
  } else {
    hue = (normalizedRed - normalizedGreen) / delta + 4
  }

  return Math.round((hue * 60 + 360) % 360)
}

const getGraphicAccentColor = (imageUrl) =>
  new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (!context) {
        resolve({ red: 94, green: 139, blue: 233 })
        return
      }

      const sampleWidth = 36
      const sampleHeight = Math.max(
        1,
        Math.round((image.naturalHeight / image.naturalWidth) * sampleWidth),
      )

      canvas.width = sampleWidth
      canvas.height = sampleHeight
      context.drawImage(image, 0, 0, sampleWidth, sampleHeight)

      const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight)
      const buckets = new Map()

      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3]

        if (alpha < 80) {
          continue
        }

        const red = data[index]
        const green = data[index + 1]
        const blue = data[index + 2]
        const max = Math.max(red, green, blue)
        const min = Math.min(red, green, blue)
        const saturation = max - min
        const brightness = (red + green + blue) / 3

        if (saturation < 44 || brightness < 45 || brightness > 235) {
          continue
        }

        const bucketRed = Math.round(red / 24) * 24
        const bucketGreen = Math.round(green / 24) * 24
        const bucketBlue = Math.round(blue / 24) * 24
        const key = `${bucketRed}-${bucketGreen}-${bucketBlue}`
        const dominance = max - brightness
        const brightnessWeight = brightness / 255
        const saturationWeight = saturation / 255
        const score =
          saturationWeight * saturation * 2.2 +
          brightnessWeight * brightness * 1.6 +
          dominance * 1.8 +
          alpha / 16
        const current = buckets.get(key) ?? {
          red: 0,
          green: 0,
          blue: 0,
          weight: 0,
        }

        buckets.set(key, {
          red: current.red + red * score,
          green: current.green + green * score,
          blue: current.blue + blue * score,
          weight: current.weight + score,
        })
      }

      const bestBucket = [...buckets.values()].sort((left, right) => right.weight - left.weight)[0]

      if (!bestBucket) {
        resolve({ red: 94, green: 139, blue: 233 })
        return
      }

      resolve({
        red: Math.round(bestBucket.red / bestBucket.weight),
        green: Math.round(bestBucket.green / bestBucket.weight),
        blue: Math.round(bestBucket.blue / bestBucket.weight),
      })
    }

    image.onerror = () => resolve({ red: 94, green: 139, blue: 233 })
    image.src = imageUrl
  })

const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(value) ? value : 0)

const getMinimumUnitPrice = (printLocations, quantityTierValue) => {
  if (quantityTierValue !== '1-5') {
    return 0
  }

  let minimumUnitPrice = 25

  const selectedLocations = Object.entries(printLocations)
    .filter(([, isSelected]) => isSelected)
    .map(([location]) => location)

  const hasLeftBreastBackBothSleeves =
    printLocations.leftBreast &&
    printLocations.fullBack &&
    printLocations.leftSleeve &&
    printLocations.rightSleeve &&
    selectedLocations.length === 4

  if (hasLeftBreastBackBothSleeves) {
    return minimumUnitPrice
  }

  if (selectedLocations.length !== 1) {
    return minimumUnitPrice
  }

  if (selectedLocations[0] === 'leftBreast') {
    return minimumUnitPrice
  }

  if (selectedLocations[0] === 'fullFront') {
    return minimumUnitPrice
  }

  return minimumUnitPrice
}

const loadImageFile = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to load uploaded image.'))
    }

    image.src = objectUrl
  })

const getColorDistance = (red, green, blue, target) =>
  Math.sqrt(
    (red - target.red) ** 2 +
      (green - target.green) ** 2 +
      (blue - target.blue) ** 2,
  )

const sampleBorderBackground = (data, width, height) => {
  const samples = []

  const pushSample = (x, y) => {
    const index = (y * width + x) * 4
    samples.push({
      red: data[index],
      green: data[index + 1],
      blue: data[index + 2],
    })
  }

  for (let x = 0; x < width; x += 1) {
    pushSample(x, 0)
    pushSample(x, height - 1)
  }

  for (let y = 1; y < height - 1; y += 1) {
    pushSample(0, y)
    pushSample(width - 1, y)
  }

  const totals = samples.reduce(
    (accumulator, sample) => ({
      red: accumulator.red + sample.red,
      green: accumulator.green + sample.green,
      blue: accumulator.blue + sample.blue,
    }),
    { red: 0, green: 0, blue: 0 },
  )

  return {
    red: totals.red / samples.length,
    green: totals.green / samples.length,
    blue: totals.blue / samples.length,
  }
}

const isBackgroundLikePixel = (data, index, backgroundColor) => {
  const red = data[index]
  const green = data[index + 1]
  const blue = data[index + 2]

  return (
    getColorDistance(red, green, blue, backgroundColor) <=
    BACKGROUND_MATCH_THRESHOLD + BACKGROUND_MATCH_SOFTNESS
  )
}

const removeWhiteBackgroundFromJpg = async (file) => {
  const image = await loadImageFile(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return URL.createObjectURL(file)
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  context.drawImage(image, 0, 0)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const width = canvas.width
  const height = canvas.height
  const backgroundColor = sampleBorderBackground(data, width, height)
  const visited = new Uint8Array(width * height)
  const queue = []

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return
    }

    const pixelIndex = y * width + x

    if (visited[pixelIndex]) {
      return
    }

    const dataIndex = pixelIndex * 4

    if (!isBackgroundLikePixel(data, dataIndex, backgroundColor)) {
      return
    }

    visited[pixelIndex] = 1
    queue.push(pixelIndex)
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  for (let pointer = 0; pointer < queue.length; pointer += 1) {
    const pixelIndex = queue[pointer]
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    const dataIndex = pixelIndex * 4
    const red = data[dataIndex]
    const green = data[dataIndex + 1]
    const blue = data[dataIndex + 2]
    const colorDistance = getColorDistance(red, green, blue, backgroundColor)
    const alphaRatio = Math.min(
      1,
      Math.max(
        0,
        (colorDistance - BACKGROUND_MATCH_THRESHOLD) / BACKGROUND_MATCH_SOFTNESS,
      ),
    )

    data[dataIndex + 3] = Math.round(alphaRatio * 255)

    enqueue(x - 1, y)
    enqueue(x + 1, y)
    enqueue(x, y - 1)
    enqueue(x, y + 1)
    enqueue(x - 1, y - 1)
    enqueue(x + 1, y - 1)
    enqueue(x - 1, y + 1)
    enqueue(x + 1, y + 1)
  }

  context.putImageData(imageData, 0, 0)

  return canvas.toDataURL('image/png')
}

function App() {
  const [form, setForm] = useState(createDefaultForm)
  const [graphics, setGraphics] = useState(DEFAULT_GRAPHICS)
  const [graphicPlacements, setGraphicPlacements] = useState({})
  const [dragState, setDragState] = useState(null)
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false)
  const [isQuoteMockVisible, setIsQuoteMockVisible] = useState(false)
  const [quoteAccentColor, setQuoteAccentColor] = useState(hexToRgb(SHIRT_COLORS[1].hex))
  const colorPickerRef = useRef(null)

  const selection = useMemo(() => {
    const blankCost = clampNumber(form.blankCost)
    const quantity = Math.max(1, clampNumber(form.quantity || 0))
    const leftBreastCost = clampNumber(form.transferPrices.leftBreast)
    const fullFrontCost = clampNumber(form.transferPrices.fullFront)
    const fullBackCost = clampNumber(form.transferPrices.fullBack)
    const sleeveCost = clampNumber(form.transferPrices.sleeve)
    const quantityTier =
      PRICING_CONFIG.quantityBreaks.find((tier) => tier.value === form.quantityTier) ??
      PRICING_CONFIG.quantityBreaks[0]
    const shirtColor =
      SHIRT_COLORS.find((color) => color.value === form.shirtColor) ?? SHIRT_COLORS[0]
    const garmentImagePrefix = getGarmentImagePrefix(form.apparelType)

    const activeDecorations = [
      form.printLocations.leftBreast ? 'Left Breast' : null,
      form.printLocations.fullFront ? 'Full Front' : null,
      form.printLocations.fullBack ? 'Full Back' : null,
      form.printLocations.leftSleeve ? 'Left Sleeve' : null,
      form.printLocations.rightSleeve ? 'Right Sleeve' : null,
    ].filter(Boolean)

    const decorationCost =
      (form.printLocations.leftBreast ? leftBreastCost : 0) +
      (form.printLocations.fullFront ? fullFrontCost : 0) +
      (form.printLocations.fullBack ? fullBackCost : 0) +
      (form.printLocations.leftSleeve ? sleeveCost : 0) +
      (form.printLocations.rightSleeve ? sleeveCost : 0)
    const unitCost = blankCost + decorationCost
    const unitPriceFromMultiplier = unitCost * quantityTier.multiplier
    const minimumUnitPrice = getMinimumUnitPrice(
      form.printLocations,
      quantityTier.value,
    )
    const unitPrice = Math.max(
      unitPriceFromMultiplier,
      minimumUnitPrice,
      ROCK_BOTTOM_UNIT_PRICE,
    )
    const customerPrice = unitPrice * quantity
    const totalCost = unitCost * quantity
    const profit = customerPrice - totalCost

    return {
      garmentLabel: PRICING_CONFIG.blankPrices[form.apparelType].label,
      garmentNote: GARMENT_NOTES[form.apparelType],
      shirtColor: {
        ...shirtColor,
        frontImage: `${ASSET_BASE_URL}shirts/${garmentImagePrefix}${shirtColor.value}-front.png`,
        backImage: `${ASSET_BASE_URL}shirts/${garmentImagePrefix}${shirtColor.value}-back.png`,
      },
      quantityTier,
      quantity,
      blankCost,
      leftBreastCost,
      fullFrontCost,
      fullBackCost,
      sleeveCost,
      activeDecorations,
      decorationCost,
      unitCost,
      minimumUnitPrice,
      unitPrice,
      customerPrice,
      totalCost,
      profit,
    }
  }, [form])

  const sharedFrontGraphic = graphics.leftBreast ?? graphics.fullFront
  const mockFrontGraphic =
    (form.printLocations.fullFront && graphics.fullFront) ||
    (form.printLocations.leftBreast && graphics.leftBreast) ||
    null
  const mockBackGraphic = form.printLocations.fullBack ? graphics.fullBack : null
  const quoteAccentCss = `${quoteAccentColor.red}, ${quoteAccentColor.green}, ${quoteAccentColor.blue}`
  const shirtColorRgb = hexToRgb(selection.shirtColor.hex)
  const quoteBaseCss = `${shirtColorRgb.red}, ${shirtColorRgb.green}, ${shirtColorRgb.blue}`
  const quoteHueRotation = rgbToHue(quoteAccentColor) - BRANDED_BACKGROUND_BASE_HUE
  const shirtMockupClassName = `shirt-mockup-image${
    form.shirtColor === 'white' ? ' shirt-mockup-image-white' : ''
  }`

  useEffect(() => {
    let isActive = true

    const updateAccentColor = async () => {
      const primaryGraphic = mockFrontGraphic?.url ?? mockBackGraphic?.url

      if (!primaryGraphic) {
        setQuoteAccentColor(hexToRgb(selection.shirtColor.hex))
        return
      }

      const nextColor = await getGraphicAccentColor(primaryGraphic)

      if (isActive) {
        setQuoteAccentColor(nextColor)
      }
    }

    updateAccentColor()

    return () => {
      isActive = false
    }
  }, [mockFrontGraphic, mockBackGraphic, selection.shirtColor.hex])

  const handleApparelChange = (event) => {
    const apparelType = event.target.value

    setForm((current) => ({
      ...current,
      apparelType,
      blankCost: PRICING_CONFIG.blankPrices[apparelType].cost.toFixed(2),
    }))
  }

  const handleQuantityTierChange = (event) => {
    const quantityTier = event.target.value
    setForm((current) => ({ ...current, quantityTier }))
  }

  const handleQuantityChange = (event) => {
    const quantity = sanitizeIntegerInput(event.target.value)
    setForm((current) => ({ ...current, quantity }))
  }

  const handleShirtColorChange = (shirtColor) => {
    setForm((current) => ({ ...current, shirtColor }))
    setIsColorMenuOpen(false)
  }

  const handlePrintToggle = (field) => (event) => {
    const checked = event.target.checked

    setForm((current) => ({
      ...current,
      printLocations: {
        ...current.printLocations,
        [field]: checked,
        ...(field === 'leftBreast' && checked ? { fullFront: false } : {}),
        ...(field === 'fullFront' && checked ? { leftBreast: false } : {}),
      },
    }))
  }

  const handleFrontPlacementChange = (field, checked) => {
    setForm((current) => ({
      ...current,
      printLocations: {
        ...current.printLocations,
        leftBreast: checked && field === 'leftBreast',
        fullFront: checked && field === 'fullFront',
      },
    }))
  }

  const handleGraphicUpload = (field) => async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const isJpgUpload = /image\/jpeg|image\/jpg/i.test(file.type) || /\.jpe?g$/i.test(file.name)

    let graphicUrl

    try {
      graphicUrl = isJpgUpload
        ? await removeWhiteBackgroundFromJpg(file)
        : URL.createObjectURL(file)
    } catch {
      graphicUrl = URL.createObjectURL(file)
    }

    setGraphics((current) => ({
      ...current,
      [field]: {
        name: file.name,
        url: graphicUrl,
      },
    }))

    event.target.value = ''
  }

  const handleFrontGraphicUpload = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const isJpgUpload = /image\/jpeg|image\/jpg/i.test(file.type) || /\.jpe?g$/i.test(file.name)

    let graphicUrl

    try {
      graphicUrl = isJpgUpload
        ? await removeWhiteBackgroundFromJpg(file)
        : URL.createObjectURL(file)
    } catch {
      graphicUrl = URL.createObjectURL(file)
    }

    const sharedGraphic = {
      name: file.name,
      url: graphicUrl,
    }

    setGraphics((current) => ({
      ...current,
      leftBreast: sharedGraphic,
      fullFront: sharedGraphic,
    }))

    event.target.value = ''
  }

  const handleGraphicPointerDown = (field) => (event) => {
    event.preventDefault()
    event.stopPropagation()

    const canvasRect = event.currentTarget.parentElement?.getBoundingClientRect()

    if (!canvasRect) {
      return
    }

    const placement = graphicPlacements[field] ?? GRAPHIC_LAYOUTS[field]

    setDragState({
      field,
      pointerId: event.pointerId,
      rect: canvasRect,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: placement.x,
      startY: placement.y,
    })
  }

  useEffect(() => {
    if (!dragState) {
      return undefined
    }

    const handlePointerMove = (event) => {
      if (event.pointerId !== dragState.pointerId) {
        return
      }

      const deltaX = ((event.clientX - dragState.startPointerX) / dragState.rect.width) * 100
      const deltaY =
        ((event.clientY - dragState.startPointerY) / dragState.rect.height) * 100

      setGraphicPlacements((current) => ({
        ...current,
        [dragState.field]: {
          ...GRAPHIC_LAYOUTS[dragState.field],
          ...(current[dragState.field] ?? {}),
          x: Math.min(92, Math.max(8, dragState.startX + deltaX)),
          y: Math.min(92, Math.max(8, dragState.startY + deltaY)),
        },
      }))
    }

    const handlePointerUp = (event) => {
      if (event.pointerId === dragState.pointerId) {
        setDragState(null)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragState])

  useEffect(() => {
    if (!isColorMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!colorPickerRef.current?.contains(event.target)) {
        setIsColorMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsColorMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isColorMenuOpen])

  return (
    <main className="app-shell">
      <section className="studio-shell">
        <article className="glass-panel hero-panel">
          <div className="hero-copy">
            <span className="panel-kicker">DTF Apparel Pricer</span>
            <h1>
              Shirt Pricer <span className="version-badge">{APP_VERSION}</span>
            </h1>
            <p>
              Live pricing, layout previews, and garment mockups for quick quoting.
            </p>
          </div>
        </article>

        <article className="glass-panel focus-panel preview-panel">
          <div className="preview-controls">
            <label className="field color-select-field">
            <span className="mini-label">Garment color</span>
            <div className="color-picker" ref={colorPickerRef}>
              <button
                type="button"
                className="spotlight-control color-picker-trigger"
                aria-haspopup="listbox"
                aria-expanded={isColorMenuOpen}
                onClick={() => setIsColorMenuOpen((current) => !current)}
              >
                <span
                  className="color-chip"
                  style={{ backgroundColor: selection.shirtColor.hex }}
                />
                <span className="color-picker-label">{selection.shirtColor.label}</span>
                <span className={`color-picker-caret ${isColorMenuOpen ? 'open' : ''}`}>
                  ▾
                </span>
              </button>
              {isColorMenuOpen ? (
                <div className="color-picker-menu" role="listbox" aria-label="Garment color">
                  {SHIRT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      role="option"
                      aria-selected={form.shirtColor === color.value}
                      className={`color-picker-option ${
                        form.shirtColor === color.value ? 'active' : ''
                      }`}
                      onClick={() => handleShirtColorChange(color.value)}
                    >
                      <span
                        className="color-chip"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </label>

            <label className="field preview-control-field">
              <span>Garment type</span>
              <select
                className="spotlight-control garment-select"
                value={form.apparelType}
                onChange={handleApparelChange}
              >
                {Object.entries(PRICING_CONFIG.blankPrices).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field preview-control-field">
              <span>Quantity tier</span>
              <select
                className="spotlight-control tier-select"
                value={form.quantityTier}
                onChange={handleQuantityTierChange}
              >
                {PRICING_CONFIG.quantityBreaks.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field preview-control-field">
              <span>Actual quantity</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.quantity}
                onChange={handleQuantityChange}
                placeholder="24"
              />
            </label>
          </div>

          <div className="glass-band layout-row">
            <span className="mini-label">Layout graphics</span>
            <div className="layout-toggle-row">
              <label className="toggle-card compact-toggle-card">
                <div className="compact-card-header">
                  <input
                    type="checkbox"
                    checked={form.printLocations.leftBreast || form.printLocations.fullFront}
                    onChange={(event) => {
                      if (!event.target.checked) {
                        handleFrontPlacementChange('fullFront', false)
                        return
                      }
                      handleFrontPlacementChange('fullFront', true)
                    }}
                  />
                  <span>Front Graphic</span>
                </div>
                <small>
                  {form.printLocations.leftBreast
                    ? formatMoney(selection.leftBreastCost)
                    : formatMoney(selection.fullFrontCost)}
                </small>
                <div className="front-size-switch">
                  <button
                    type="button"
                    className={`size-chip ${form.printLocations.leftBreast ? 'active' : ''}`}
                    onClick={(event) => {
                      event.preventDefault()
                      handleFrontPlacementChange('leftBreast', true)
                    }}
                  >
                    Left Breast
                  </button>
                  <button
                    type="button"
                    className={`size-chip ${form.printLocations.fullFront ? 'active' : ''}`}
                    onClick={(event) => {
                      event.preventDefault()
                      handleFrontPlacementChange('fullFront', true)
                    }}
                  >
                    Full Front
                  </button>
                </div>
                <div
                  className="upload-row"
                  onClick={(event) => event.stopPropagation()}
                >
                  <label className="upload-button">
                    Upload graphic
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFrontGraphicUpload}
                    />
                  </label>
                  <small className="upload-meta">{sharedFrontGraphic?.name ?? ''}</small>
                </div>
              </label>

              <label className="toggle-card compact-toggle-card">
                <div className="compact-card-header">
                  <input
                    type="checkbox"
                    checked={form.printLocations.leftSleeve}
                    onChange={handlePrintToggle('leftSleeve')}
                  />
                  <span>Left Sleeve</span>
                </div>
                <small>{formatMoney(selection.sleeveCost)} per sleeve</small>
                <div
                  className="upload-row"
                  onClick={(event) => event.stopPropagation()}
                >
                  <label className="upload-button">
                    Upload graphic
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGraphicUpload('leftSleeve')}
                    />
                  </label>
                  <small className="upload-meta">{graphics.leftSleeve?.name ?? ''}</small>
                </div>
              </label>

              <label className="toggle-card compact-toggle-card">
                <div className="compact-card-header">
                  <input
                    type="checkbox"
                    checked={form.printLocations.rightSleeve}
                    onChange={handlePrintToggle('rightSleeve')}
                  />
                  <span>Right Sleeve</span>
                </div>
                <small>{formatMoney(selection.sleeveCost)} per sleeve</small>
                <div
                  className="upload-row"
                  onClick={(event) => event.stopPropagation()}
                >
                  <label className="upload-button">
                    Upload graphic
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGraphicUpload('rightSleeve')}
                    />
                  </label>
                  <small className="upload-meta">{graphics.rightSleeve?.name ?? ''}</small>
                </div>
              </label>

              <label className="toggle-card compact-toggle-card">
                <div className="compact-card-header">
                  <input
                    type="checkbox"
                    checked={form.printLocations.fullBack}
                    onChange={handlePrintToggle('fullBack')}
                  />
                  <span>Full Back</span>
                </div>
                <small>{formatMoney(selection.fullBackCost)} each</small>
                <div
                  className="upload-row"
                  onClick={(event) => event.stopPropagation()}
                >
                  <label className="upload-button">
                    Upload graphic
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGraphicUpload('fullBack')}
                    />
                  </label>
                  <small className="upload-meta">{graphics.fullBack?.name ?? ''}</small>
                </div>
              </label>
            </div>
          </div>

          <div className="glass-band mockup-band">
            <div className="mockup-gallery">
              <figure className="mockup-stage">
                <figcaption className="mockup-caption">Front</figcaption>
                <div className="mockup-frame">
                  <div className="mockup-canvas">
                    <img
                      src={selection.shirtColor.frontImage}
                      alt={`${selection.shirtColor.label} shirt front`}
                      className={shirtMockupClassName}
                    />
                    {Object.entries(GRAPHIC_LAYOUTS).map(([field, config]) => {
                      if (config.view !== 'front' || !form.printLocations[field] || !graphics[field]) {
                        return null
                      }

                      const placement = graphicPlacements[field] ?? config

                      return (
                        <div
                          key={field}
                          className={`graphic-overlay ${dragState?.field === field ? 'dragging' : ''}`}
                          title={`${field} graphic at ${config.widthLabel}`}
                          style={{
                            left: `${placement.x}%`,
                            top: `${placement.y}%`,
                            width: `${placement.width}%`,
                            transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                          }}
                          onPointerDown={handleGraphicPointerDown(field)}
                        >
                          <img
                            src={graphics[field].url}
                            alt={graphics[field].name}
                            className="graphic-overlay-image"
                            draggable="false"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </figure>
              <figure className="mockup-stage">
                <figcaption className="mockup-caption">Back</figcaption>
                <div className="mockup-frame">
                  <div className="mockup-canvas">
                    <img
                      src={selection.shirtColor.backImage}
                      alt={`${selection.shirtColor.label} shirt back`}
                      className={shirtMockupClassName}
                    />
                    {Object.entries(GRAPHIC_LAYOUTS).map(([field, config]) => {
                      if (config.view !== 'back' || !form.printLocations[field] || !graphics[field]) {
                        return null
                      }

                      const placement = graphicPlacements[field] ?? config

                      return (
                        <div
                          key={field}
                          className={`graphic-overlay ${dragState?.field === field ? 'dragging' : ''}`}
                          title={`${field} graphic at ${config.widthLabel}`}
                          style={{
                            left: `${placement.x}%`,
                            top: `${placement.y}%`,
                            width: `${placement.width}%`,
                            transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                          }}
                          onPointerDown={handleGraphicPointerDown(field)}
                        >
                          <img
                            src={graphics[field].url}
                            alt={graphics[field].name}
                            className="graphic-overlay-image"
                            draggable="false"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </figure>
            </div>
          </div>
        </article>

        <section className="glass-panel focus-panel pricing-summary-panel">
          <div className="pricing-summary-header">
            <div>
              <span className="mini-label">Pricing snapshot</span>
            </div>
            <button
              type="button"
              className="quote-mock-button"
              onClick={() => setIsQuoteMockVisible((current) => !current)}
            >
              {isQuoteMockVisible ? 'Hide mock with pricing' : 'Generate mock with pricing'}
            </button>
          </div>
          <div className="pricing-summary-grid">
            <div>
              <p className="mini-label">Garment cost</p>
              <strong>{formatMoney(selection.blankCost)}</strong>
            </div>
            <div>
              <p className="mini-label">Graphics cost</p>
              <strong>{formatMoney(selection.decorationCost)}</strong>
            </div>
            <div>
              <p className="mini-label">Total cost</p>
              <strong>{formatMoney(selection.unitCost)}</strong>
            </div>
            <div>
              <p className="mini-label">Multiplier</p>
              <strong>{selection.quantityTier.multiplier.toFixed(2)}x</strong>
            </div>
            <div>
              <p className="mini-label">Suggested sale price</p>
              <strong>{formatMoney(selection.unitPrice)}</strong>
            </div>
            <div>
              <p className="mini-label">Customer price</p>
              <strong>{formatMoney(selection.customerPrice)}</strong>
            </div>
            <div>
              <p className="mini-label">Profit</p>
              <strong>{formatMoney(selection.profit)}</strong>
            </div>
          </div>
        </section>

        {isQuoteMockVisible ? (
          <section className="glass-panel focus-panel quote-mock-panel">
            <div
              className="quote-mock-sheet"
              style={{
                '--quote-accent': quoteAccentCss,
                '--quote-base': quoteBaseCss,
                '--quote-background-image': `url(${ASSET_BASE_URL}backgrond-blue.png)`,
                '--quote-hue': `${quoteHueRotation}deg`,
              }}
            >
              <div className="quote-mock-watermarks" aria-hidden="true">
                <img
                  src={`${ASSET_BASE_URL}company-logo.png`}
                  alt=""
                  className="quote-mock-watermark quote-mock-watermark-logo"
                />
                {mockFrontGraphic ? (
                  <img
                    src={mockFrontGraphic.url}
                    alt=""
                    className="quote-mock-watermark quote-mock-watermark-front"
                  />
                ) : null}
                {mockBackGraphic ? (
                  <img
                    src={mockBackGraphic.url}
                    alt=""
                    className="quote-mock-watermark quote-mock-watermark-back"
                  />
                ) : null}
              </div>

              <div className="quote-mock-header">
                <img
                  src={`${ASSET_BASE_URL}company-logo.png`}
                  alt="CJC Custom Apparel logo"
                  className="quote-mock-logo"
                />
                <div className="quote-mock-title-block">
                  <span className="mini-label">Branded mock with pricing</span>
                  <h2>{selection.garmentLabel}</h2>
                  <p>
                    {selection.shirtColor.label} · {selection.quantity} pieces ·{' '}
                    {selection.quantityTier.label}
                  </p>
                </div>
              </div>

              <div className="quote-mock-body">
                <div className="quote-mock-garments">
                  <figure className="quote-mock-card">
                    <figcaption>Front mock</figcaption>
                    <div className="quote-mock-canvas">
                      <img
                        src={selection.shirtColor.frontImage}
                        alt={`${selection.shirtColor.label} ${selection.garmentLabel} front`}
                        className={shirtMockupClassName}
                      />
                      {Object.entries(GRAPHIC_LAYOUTS).map(([field, config]) => {
                        if (config.view !== 'front' || !form.printLocations[field] || !graphics[field]) {
                          return null
                        }

                        const placement = graphicPlacements[field] ?? config

                        return (
                          <div
                            key={`quote-front-${field}`}
                            className="graphic-overlay quote-mock-overlay"
                            style={{
                              left: `${placement.x}%`,
                              top: `${placement.y}%`,
                              width: `${placement.width}%`,
                              transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                            }}
                          >
                            <img
                              src={graphics[field].url}
                              alt={graphics[field].name}
                              className="graphic-overlay-image"
                              draggable="false"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </figure>

                  <figure className="quote-mock-card">
                    <figcaption>Back mock</figcaption>
                    <div className="quote-mock-canvas">
                      <img
                        src={selection.shirtColor.backImage}
                        alt={`${selection.shirtColor.label} ${selection.garmentLabel} back`}
                        className={shirtMockupClassName}
                      />
                      {Object.entries(GRAPHIC_LAYOUTS).map(([field, config]) => {
                        if (config.view !== 'back' || !form.printLocations[field] || !graphics[field]) {
                          return null
                        }

                        const placement = graphicPlacements[field] ?? config

                        return (
                          <div
                            key={`quote-back-${field}`}
                            className="graphic-overlay quote-mock-overlay"
                            style={{
                              left: `${placement.x}%`,
                              top: `${placement.y}%`,
                              width: `${placement.width}%`,
                              transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                            }}
                          >
                            <img
                              src={graphics[field].url}
                              alt={graphics[field].name}
                              className="graphic-overlay-image"
                              draggable="false"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </figure>
                </div>

                <div className="quote-mock-sidebar">
                  <div className="quote-mock-pricing">
                    <div>
                      <span className="mini-label">Customer price</span>
                      <strong>{formatMoney(selection.customerPrice)}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Profit</span>
                      <strong>{formatMoney(selection.profit)}</strong>
                    </div>
                  </div>

                  <div className="quote-mock-lines">
                    <div>
                      <span className="mini-label">Garment cost</span>
                      <strong>{formatMoney(selection.blankCost)}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Graphics cost</span>
                      <strong>{formatMoney(selection.decorationCost)}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Total cost</span>
                      <strong>{formatMoney(selection.unitCost)}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Multiplier</span>
                      <strong>{selection.quantityTier.multiplier.toFixed(2)}x</strong>
                    </div>
                    <div>
                      <span className="mini-label">Suggested sale price</span>
                      <strong>{formatMoney(selection.unitPrice)}</strong>
                    </div>
                  </div>

                  <div className="quote-mock-tags">
                    {selection.activeDecorations.length ? (
                      selection.activeDecorations.map((item) => (
                        <span key={`quote-tag-${item}`} className="active-tag">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="active-tag muted">No decoration selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

      </section>
    </main>
  )
}

export default App
