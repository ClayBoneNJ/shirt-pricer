import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import packageJson from '../package.json'

const PRICING_CONFIG = {
  blankPrices: {
    standard: { label: 'Standard T-Shirt', cost: 3.53 },
    soft: { label: 'Soft T-Shirt', cost: 4.39 },
    polo: { label: 'Polo', cost: 8.73 },
    hoodie: { label: 'Hoodie', cost: 13.59 },
  },
  quantityBreaks: [
    { value: '1-5', label: '1-5 pieces', multiplier: 2.1 },
    { value: '6-11', label: '6-11 pieces', multiplier: 2.1 },
    { value: '12-23', label: '12-23 pieces', multiplier: 1.9 },
    { value: '24-47', label: '24-47 pieces', multiplier: 1.7 },
    { value: '48-71', label: '48-71 pieces', multiplier: 1.58 },
    { value: '72+', label: '72+ pieces', multiplier: 1.46 },
  ],
  transferPrices: {
    leftBreast: { label: 'Left Breast', cost: 1.5 },
    fullFront: { label: 'Full Front', cost: 5 },
    fullBack: { label: 'Full Back', cost: 5 },
    sleeve: { label: 'Sleeve Print', cost: 1.5 },
  },
}

const DEFAULT_APPAREL = 'standard'
const ASSET_BASE_URL = import.meta.env.BASE_URL
const formatAppVersion = (version) => {
  const versionParts = version.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const displayVersionNumber = versionParts[0] * 10000 + versionParts[1] * 100 + versionParts[2]

  return `v${String(displayVersionNumber).padStart(3, '0')}`
}

const APP_VERSION = formatAppVersion(packageJson.version)
const MINIMUM_EFFECTIVE_MULTIPLIER = 2
const MULTIPLIER_FLOOR_UNLOCK_TIERS = new Set(['24-47', '48-71', '72+'])
const QUOTE_EXPORT_WIDTH = 1180
const QUOTE_EXPORT_HEIGHT = 820
const ABSOLUTE_MINIMUM_UNIT_PRICE = 8.75
const PRICING_PRESETS = {
  budget: {
    label: '$',
    multiplierScale: 0.94,
    minimumUnitPrice: 25,
  },
  standard: {
    label: '$$',
    multiplierScale: 1,
    minimumUnitPrice: 25,
  },
  premium: {
    label: '$$$',
    multiplierScale: 1.08,
    minimumUnitPrice: 25,
  },
}

const QUOTE_BACKGROUNDS = [
  {
    value: 'backgrounds/backdrop-01.png',
    label: 'Backdrop 1',
    baseHue: 210,
  },
  {
    value: 'backgrounds/backdrop-02.png',
    label: 'Backdrop 2',
    baseHue: 210,
  },
  {
    value: 'backgrounds/backdrop-03.png',
    label: 'Backdrop 3',
    baseHue: 210,
  },
  {
    value: 'backgrounds/backdrop-04.png',
    label: 'Backdrop 4',
    baseHue: 210,
  },
  {
    value: 'backgrounds/backdrop-05.png',
    label: 'Backdrop 5',
    baseHue: 210,
  },
  {
    value: 'backgrounds/backdrop-06.png',
    label: 'Backdrop 6',
    baseHue: 210,
  },
  {
    value: 'backgrounds/backdrop-07.png',
    label: 'Backdrop 7',
    baseHue: 210,
  },
  {
    value: 'backgrounds/backdrop-08.png',
    label: 'Backdrop 8',
    baseHue: 210,
  },
  {
    value: 'backgrounds/backdrop-09.png',
    label: 'Backdrop 9',
    baseHue: 210,
  },
]

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
    hex: '#0a1426',
  },
  {
    value: 'charcoal',
    label: 'Charcoal',
    hex: '#374151',
  },
  {
    value: 'light-grey',
    label: 'Light Grey',
    hex: '#6b7684',
    assetValue: 'heather',
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
    hex: '#1565d8',
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
  quantity: '5',
  quantityTier: getQuantityTierForQuantity(5)?.value ?? PRICING_CONFIG.quantityBreaks[0].value,
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

const DEFAULT_BACKGROUND_REMOVAL = {
  leftBreast: true,
  fullFront: true,
  fullBack: true,
  leftSleeve: true,
  rightSleeve: true,
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
const GRAPHIC_SIZE_STEP = 2
const GRAPHIC_MIN_WIDTH = 6
const GRAPHIC_MAX_WIDTH = 80

const clampNumber = (value) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

const sanitizeIntegerInput = (value) => value.replace(/\D/g, '')

const getQuantityTierForQuantity = (quantity) => {
  if (quantity >= 72) {
    return PRICING_CONFIG.quantityBreaks.find((tier) => tier.value === '72+')
  }

  if (quantity >= 48) {
    return PRICING_CONFIG.quantityBreaks.find((tier) => tier.value === '48-71')
  }

  if (quantity >= 24) {
    return PRICING_CONFIG.quantityBreaks.find((tier) => tier.value === '24-47')
  }

  if (quantity >= 12) {
    return PRICING_CONFIG.quantityBreaks.find((tier) => tier.value === '12-23')
  }

  if (quantity >= 6) {
    return PRICING_CONFIG.quantityBreaks.find((tier) => tier.value === '6-11')
  }

  return PRICING_CONFIG.quantityBreaks.find((tier) => tier.value === '1-5')
}

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

const getMinimumUnitPrice = (printLocations, quantityTierValue, pricingPreset) => {
  if (quantityTierValue !== '1-5') {
    return 0
  }

  let minimumUnitPrice = pricingPreset.minimumUnitPrice

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

const loadImageFromSrc = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`))

    image.src = src
  })

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read uploaded image.'))

    reader.readAsDataURL(file)
  })

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('Unable to create image blob.'))
    }, type, quality)
  })

const drawRoundedRect = (context, x, y, width, height, radius) => {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

const getOpaqueImageBounds = (image, alphaThreshold = 8) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return { x: 0, y: 0, width: image.width, height: image.height }
  }

  canvas.width = image.width
  canvas.height = image.height
  context.drawImage(image, 0, 0)

  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]

      if (alpha > alphaThreshold) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width: image.width, height: image.height }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

const drawContainedImage = (
  context,
  image,
  x,
  y,
  width,
  height,
  rotation = 0,
  sourceBounds = null,
) => {
  const sourceWidth = sourceBounds?.width ?? image.width
  const sourceHeight = sourceBounds?.height ?? image.height
  const sourceX = sourceBounds?.x ?? 0
  const sourceY = sourceBounds?.y ?? 0
  const scale = Math.min(width / sourceWidth, height / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale

  context.save()
  context.translate(x + width / 2, y + height / 2)
  context.rotate((rotation * Math.PI) / 180)
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  )
  context.restore()
}

const drawOverlayImage = (context, image, x, y, width, rotation = 0) => {
  const drawHeight = (image.height / image.width) * width

  context.save()
  context.translate(x, y)
  context.rotate((rotation * Math.PI) / 180)
  context.drawImage(image, -width / 2, -drawHeight / 2, width, drawHeight)
  context.restore()
}

const clampUnit = (value) => Math.min(1, Math.max(0, value))

const rgbToHsl = (red, green, blue) => {
  const normalizedRed = red / 255
  const normalizedGreen = green / 255
  const normalizedBlue = blue / 255
  const max = Math.max(normalizedRed, normalizedGreen, normalizedBlue)
  const min = Math.min(normalizedRed, normalizedGreen, normalizedBlue)
  const lightness = (max + min) / 2

  if (max === min) {
    return { hue: 0, saturation: 0, lightness }
  }

  const delta = max - min
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)

  let hue

  if (max === normalizedRed) {
    hue = (normalizedGreen - normalizedBlue) / delta + (normalizedGreen < normalizedBlue ? 6 : 0)
  } else if (max === normalizedGreen) {
    hue = (normalizedBlue - normalizedRed) / delta + 2
  } else {
    hue = (normalizedRed - normalizedGreen) / delta + 4
  }

  return { hue: hue / 6, saturation, lightness }
}

const hueToRgb = (p, q, t) => {
  let value = t

  if (value < 0) {
    value += 1
  }

  if (value > 1) {
    value -= 1
  }

  if (value < 1 / 6) {
    return p + (q - p) * 6 * value
  }

  if (value < 1 / 2) {
    return q
  }

  if (value < 2 / 3) {
    return p + (q - p) * (2 / 3 - value) * 6
  }

  return p
}

const hslToRgb = (hue, saturation, lightness) => {
  if (saturation === 0) {
    const value = Math.round(lightness * 255)
    return { red: value, green: value, blue: value }
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q

  return {
    red: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    green: Math.round(hueToRgb(p, q, hue) * 255),
    blue: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  }
}

const getAdjustedBackgroundCanvas = (
  image,
  width,
  height,
  { hueRotation = 0, saturation = 1, brightness = 1, contrast = 1 } = {},
) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return image
  }

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  const imageData = context.getImageData(0, 0, width, height)
  const { data } = imageData
  const hueOffset = hueRotation / 360

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]

    if (alpha === 0) {
      continue
    }

    const hsl = rgbToHsl(data[index], data[index + 1], data[index + 2])
    const adjustedHue = (hsl.hue + hueOffset + 1) % 1
    const adjustedSaturation = clampUnit(hsl.saturation * saturation)
    const adjustedRgb = hslToRgb(adjustedHue, adjustedSaturation, hsl.lightness)

    const contrastedRed =
      (((adjustedRgb.red / 255 - 0.5) * contrast + 0.5) * brightness)
    const contrastedGreen =
      (((adjustedRgb.green / 255 - 0.5) * contrast + 0.5) * brightness)
    const contrastedBlue =
      (((adjustedRgb.blue / 255 - 0.5) * contrast + 0.5) * brightness)

    data[index] = Math.round(clampUnit(contrastedRed) * 255)
    data[index + 1] = Math.round(clampUnit(contrastedGreen) * 255)
    data[index + 2] = Math.round(clampUnit(contrastedBlue) * 255)
  }

  context.putImageData(imageData, 0, 0)

  return canvas
}

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

    if (data[index + 3] <= 24) {
      return
    }

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

  if (!samples.length) {
    return null
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
  if (!backgroundColor || data[index + 3] <= 24) {
    return false
  }

  const red = data[index]
  const green = data[index + 1]
  const blue = data[index + 2]

  return (
    getColorDistance(red, green, blue, backgroundColor) <=
    BACKGROUND_MATCH_THRESHOLD + BACKGROUND_MATCH_SOFTNESS
  )
}

const removeBackgroundFromRaster = async (file) => {
  const image = await loadImageFile(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return readFileAsDataUrl(file)
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  context.drawImage(image, 0, 0)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const width = canvas.width
  const height = canvas.height
  const backgroundColor = sampleBorderBackground(data, width, height)

  if (!backgroundColor) {
    return readFileAsDataUrl(file)
  }

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

const buildGraphicUrl = async (file, shouldRemoveBackground) => {
  const isRasterUpload =
    /image\/jpeg|image\/jpg|image\/png|image\/webp/i.test(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name)

  if (!shouldRemoveBackground || !isRasterUpload) {
    return readFileAsDataUrl(file)
  }

  try {
    return await removeBackgroundFromRaster(file)
  } catch {
    return readFileAsDataUrl(file)
  }
}

function App() {
  const [form, setForm] = useState(createDefaultForm)
  const [customerName, setCustomerName] = useState('')
  const [graphics, setGraphics] = useState(DEFAULT_GRAPHICS)
  const [backgroundRemoval, setBackgroundRemoval] = useState(DEFAULT_BACKGROUND_REMOVAL)
  const [graphicPlacements, setGraphicPlacements] = useState({})
  const [dragState, setDragState] = useState(null)
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false)
  const [isQuoteMockVisible, setIsQuoteMockVisible] = useState(false)
  const [quoteAccentColor, setQuoteAccentColor] = useState(hexToRgb(SHIRT_COLORS[1].hex))
  const [isQuoteMockExporting, setIsQuoteMockExporting] = useState(false)
  const [quoteBackground, setQuoteBackground] = useState(QUOTE_BACKGROUNDS[0].value)
  const [pricingPresetKey, setPricingPresetKey] = useState('standard')
  const quoteMockRef = useRef(null)
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
      getQuantityTierForQuantity(quantity) ??
      PRICING_CONFIG.quantityBreaks[0]
    const pricingPreset = PRICING_PRESETS[pricingPresetKey] ?? PRICING_PRESETS.standard
    const shirtColor =
      SHIRT_COLORS.find((color) => color.value === form.shirtColor) ?? SHIRT_COLORS[0]
    const garmentImagePrefix = getGarmentImagePrefix(form.apparelType)
    const garmentAssetValue = shirtColor.assetValue ?? shirtColor.value

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
    const scaledMultiplier = quantityTier.multiplier * pricingPreset.multiplierScale
    const effectiveMultiplier = MULTIPLIER_FLOOR_UNLOCK_TIERS.has(quantityTier.value)
      ? scaledMultiplier
      : Math.max(MINIMUM_EFFECTIVE_MULTIPLIER, scaledMultiplier)
    const unitPriceFromMultiplier =
      unitCost * effectiveMultiplier
    const minimumUnitPrice = getMinimumUnitPrice(
      form.printLocations,
      quantityTier.value,
      pricingPreset,
    )
    const unitPrice = Math.max(
      unitPriceFromMultiplier,
      minimumUnitPrice,
      ABSOLUTE_MINIMUM_UNIT_PRICE,
    )
    const customerPrice = unitPrice * quantity
    const totalCost = unitCost * quantity
    const profit = customerPrice - totalCost

    return {
      garmentLabel: PRICING_CONFIG.blankPrices[form.apparelType].label,
      garmentNote: GARMENT_NOTES[form.apparelType],
      shirtColor: {
        ...shirtColor,
        frontImage: `${ASSET_BASE_URL}shirts/${garmentImagePrefix}${garmentAssetValue}-front.png`,
        backImage: `${ASSET_BASE_URL}shirts/${garmentImagePrefix}${garmentAssetValue}-back.png`,
      },
      quantityTier,
      pricingPreset,
      effectiveMultiplier,
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
  }, [form, pricingPresetKey])

  const sharedFrontGraphic = graphics.leftBreast ?? graphics.fullFront
  const activeFrontField = form.printLocations.leftBreast ? 'leftBreast' : 'fullFront'
  const mockFrontGraphic =
    (form.printLocations.fullFront && graphics.fullFront) ||
    (form.printLocations.leftBreast && graphics.leftBreast) ||
    null
  const mockBackGraphic = form.printLocations.fullBack ? graphics.fullBack : null
  const quoteAccentCss = `${quoteAccentColor.red}, ${quoteAccentColor.green}, ${quoteAccentColor.blue}`
  const shirtColorRgb = hexToRgb(selection.shirtColor.hex)
  const quoteBaseCss = `${shirtColorRgb.red}, ${shirtColorRgb.green}, ${shirtColorRgb.blue}`
  const quoteBackgroundConfig =
    QUOTE_BACKGROUNDS.find((background) => background.value === quoteBackground) ??
    QUOTE_BACKGROUNDS[0]
  const quoteHueRotation = rgbToHue(quoteAccentColor) - quoteBackgroundConfig.baseHue
  const shirtMockupClassName = `shirt-mockup-image${
    form.shirtColor === 'white'
      ? ' shirt-mockup-image-white'
      : form.shirtColor === 'navy'
        ? ' shirt-mockup-image-navy'
      : form.shirtColor === 'light-grey'
        ? ' shirt-mockup-image-light-grey'
        : ''
  }`
  const quoteMockFileName = `${selection.garmentLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${selection.shirtColor.value}-${selection.quantity}-piece-quote.jpg`
  const quoteHeaderName = customerName.trim() || 'Customer Name'
  const quotePlacementSummary = selection.activeDecorations.length
    ? selection.activeDecorations.join(' + ')
    : 'No graphics selected'
  const quoteBackgroundSrc = `${ASSET_BASE_URL}${quoteBackground}`

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

  const handleQuantityChange = (event) => {
    const quantity = sanitizeIntegerInput(event.target.value)
    const matchedTier =
      getQuantityTierForQuantity(Math.max(1, clampNumber(quantity || 0))) ??
      PRICING_CONFIG.quantityBreaks[0]

    setForm((current) => ({
      ...current,
      quantity,
      quantityTier: matchedTier.value,
    }))
  }

  const handleQuantityTierChange = (event) => {
    const quantityTier = event.target.value

    setForm((current) => ({
      ...current,
      quantityTier,
    }))
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
    const shouldRemoveBackground = backgroundRemoval[field]
    const graphicUrl = await buildGraphicUrl(file, shouldRemoveBackground)

    setGraphics((current) => ({
      ...current,
      [field]: {
        name: file.name,
        url: graphicUrl,
        file,
      },
    }))

    event.target.value = ''
  }

  const handleFrontGraphicUpload = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }
    const shouldRemoveBackground =
      backgroundRemoval.leftBreast && backgroundRemoval.fullFront
    const graphicUrl = await buildGraphicUrl(file, shouldRemoveBackground)

    const sharedGraphic = {
      name: file.name,
      url: graphicUrl,
      file,
    }

    setGraphics((current) => ({
      ...current,
      leftBreast: sharedGraphic,
      fullFront: sharedGraphic,
    }))

    event.target.value = ''
  }

  const handleGraphicBackgroundToggle = (field) => async (event) => {
    const checked = event.target.checked

    setBackgroundRemoval((current) => ({
      ...current,
      [field]: checked,
    }))

    const sourceGraphic = graphics[field]

    if (!sourceGraphic?.file) {
      return
    }

    const graphicUrl = await buildGraphicUrl(sourceGraphic.file, checked)

    setGraphics((current) => ({
      ...current,
      [field]: {
        ...current[field],
        url: graphicUrl,
      },
    }))
  }

  const handleFrontBackgroundToggle = async (event) => {
    const checked = event.target.checked

    setBackgroundRemoval((current) => ({
      ...current,
      leftBreast: checked,
      fullFront: checked,
    }))

    const sourceGraphic = graphics.leftBreast ?? graphics.fullFront

    if (!sourceGraphic?.file) {
      return
    }

    const graphicUrl = await buildGraphicUrl(sourceGraphic.file, checked)
    const sharedGraphic = {
      ...sourceGraphic,
      url: graphicUrl,
    }

    setGraphics((current) => ({
      ...current,
      leftBreast: sharedGraphic,
      fullFront: sharedGraphic,
    }))
  }

  const handleGraphicSizeAdjust = (field, direction) => () => {
    const step = direction === 'increase' ? GRAPHIC_SIZE_STEP : -GRAPHIC_SIZE_STEP

    setGraphicPlacements((current) => {
      const basePlacement = current[field] ?? GRAPHIC_LAYOUTS[field]
      const nextWidth = Math.min(
        GRAPHIC_MAX_WIDTH,
        Math.max(GRAPHIC_MIN_WIDTH, basePlacement.width + step),
      )

      return {
        ...current,
        [field]: {
          ...GRAPHIC_LAYOUTS[field],
          ...basePlacement,
          width: nextWidth,
        },
      }
    })
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

  const buildQuoteMockJpgBlob = async () => {
    if (!quoteMockRef.current) {
      return null
    }

    const canvas = document.createElement('canvas')
    const pixelRatio = 2
    canvas.width = QUOTE_EXPORT_WIDTH * pixelRatio
    canvas.height = QUOTE_EXPORT_HEIGHT * pixelRatio

    const context = canvas.getContext('2d')

    if (!context) {
      return null
    }

    context.scale(pixelRatio, pixelRatio)

    const drawSoftPanel = (x, y, width, height, radius, fillStyle, shadowBlur = 0) => {
      context.save()
      context.fillStyle = fillStyle
      context.strokeStyle = 'rgba(17, 24, 39, 0.08)'
      context.lineWidth = 1
      context.shadowColor = 'rgba(15, 23, 42, 0.14)'
      context.shadowBlur = shadowBlur
      context.shadowOffsetY = shadowBlur > 0 ? 12 : 0
      drawRoundedRect(context, x, y, width, height, radius)
      context.fill()
      context.shadowColor = 'transparent'
      context.stroke()
      context.restore()
    }

    const pillFont = '700 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    const labelFont = '900 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    const miniLabelFont = '700 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'

    const drawPill = (x, y, text) => {
      context.save()
      context.font = pillFont
      const metrics = context.measureText(text)
      const width = metrics.width + 26
      drawSoftPanel(x, y, width, 28, 999, 'rgba(15, 23, 42, 0.08)')
      context.fillStyle = '#334155'
      context.textBaseline = 'middle'
      context.fillText(text, x + 13, y + 14)
      context.restore()
      return width
    }

    const drawCaptionPill = (centerX, y, text) => {
      context.save()
      context.font = labelFont
      const width = context.measureText(text).width + 28
      drawSoftPanel(centerX - width / 2, y, width, 36, 999, 'rgba(255, 255, 255, 0.96)', 18)
      context.fillStyle = '#111827'
      context.textBaseline = 'middle'
      context.fillText(text, centerX - width / 2 + 14, y + 18)
      context.restore()
    }

    const drawWrappedText = (text, x, y, maxWidth, lineHeight, maxLines = 2) => {
      const words = text.split(/\s+/)
      const lines = []
      let currentLine = ''

      words.forEach((word) => {
        const nextLine = currentLine ? `${currentLine} ${word}` : word
        if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
          currentLine = nextLine
        } else if (lines.length < maxLines - 1) {
          lines.push(currentLine)
          currentLine = word
        }
      })

      if (currentLine) {
        lines.push(currentLine)
      }

      lines.slice(0, maxLines).forEach((line, index) => {
        context.fillText(line, x, y + index * lineHeight)
      })
    }

    const drawMockupCard = ({
      shirtImage,
      shirtBounds,
      overlayImageMap,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      cardRotation,
      view,
    }) => {
      context.save()
      context.translate(cardX + cardWidth / 2, cardY + cardHeight / 2)
      context.rotate((cardRotation * Math.PI) / 180)
      context.shadowColor = 'rgba(0, 0, 0, 0.18)'
      context.shadowBlur = 24
      context.shadowOffsetY = 10
      drawContainedImage(
        context,
        shirtImage,
        -cardWidth / 2,
        -cardHeight / 2,
        cardWidth,
        cardHeight,
        0,
        shirtBounds,
      )
      context.shadowColor = 'transparent'

      Object.entries(GRAPHIC_LAYOUTS).forEach(([field, config]) => {
        if (config.view !== view || !form.printLocations[field] || !graphics[field] || !overlayImageMap[field]) {
          return
        }

        const placement = graphicPlacements[field] ?? config
        const overlayX = -cardWidth / 2 + (placement.x / 100) * cardWidth
        const overlayY = -cardHeight / 2 + (placement.y / 100) * cardHeight
        const overlayWidth = (placement.width / 100) * cardWidth
        drawOverlayImage(context, overlayImageMap[field], overlayX, overlayY, overlayWidth, placement.rotation)
      })

      context.restore()
    }

    try {
      const loadOptionalImage = async (src) => {
        if (!src) {
          return null
        }

        try {
          return await loadImageFromSrc(src)
        } catch {
          return null
        }
      }

      const overlayImages = Object.fromEntries(
        await Promise.all(
          Object.entries(graphics).map(async ([field, graphic]) => [
            field,
            await loadOptionalImage(graphic?.url),
          ]),
        ),
      )

      const [backgroundImage, logoImage, frontShirtImage, backShirtImage, frontWatermarkImage, backWatermarkImage] =
        await Promise.all([
          loadOptionalImage(quoteBackgroundSrc),
          loadOptionalImage(`${ASSET_BASE_URL}company-logo.png`),
          loadOptionalImage(selection.shirtColor.frontImage),
          loadOptionalImage(selection.shirtColor.backImage),
          loadOptionalImage(mockFrontGraphic?.url),
          loadOptionalImage(mockBackGraphic?.url),
        ])

      const frontShirtBounds = frontShirtImage ? getOpaqueImageBounds(frontShirtImage) : null
      const backShirtBounds = backShirtImage ? getOpaqueImageBounds(backShirtImage) : null

      context.fillStyle = '#111827'
      context.fillRect(0, 0, QUOTE_EXPORT_WIDTH, QUOTE_EXPORT_HEIGHT)

      if (backgroundImage) {
        const adjustedBackground = getAdjustedBackgroundCanvas(backgroundImage, QUOTE_EXPORT_WIDTH, QUOTE_EXPORT_HEIGHT, {
          hueRotation: quoteHueRotation,
          saturation: 1.35,
          brightness: 0.72,
          contrast: 1.08,
        })

        context.save()
        context.globalAlpha = 0.72
        context.drawImage(
          adjustedBackground,
          -QUOTE_EXPORT_WIDTH * 0.04,
          -QUOTE_EXPORT_HEIGHT * 0.04,
          QUOTE_EXPORT_WIDTH * 1.08,
          QUOTE_EXPORT_HEIGHT * 1.08,
        )
        context.restore()
      }

      const accentGlow = context.createRadialGradient(0, 0, 0, 0, 0, QUOTE_EXPORT_WIDTH * 0.42)
      accentGlow.addColorStop(0, `rgba(${quoteAccentCss}, 0.34)`)
      accentGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = accentGlow
      context.fillRect(0, 0, QUOTE_EXPORT_WIDTH, QUOTE_EXPORT_HEIGHT)

      const baseGlow = context.createRadialGradient(
        QUOTE_EXPORT_WIDTH,
        QUOTE_EXPORT_HEIGHT,
        0,
        QUOTE_EXPORT_WIDTH,
        QUOTE_EXPORT_HEIGHT,
        QUOTE_EXPORT_WIDTH * 0.48,
      )
      baseGlow.addColorStop(0, `rgba(${quoteBaseCss}, 0.24)`)
      baseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = baseGlow
      context.fillRect(0, 0, QUOTE_EXPORT_WIDTH, QUOTE_EXPORT_HEIGHT)

      if (logoImage) {
        context.save()
        context.globalAlpha = 0.12
        drawContainedImage(context, logoImage, -60, 560, 440, 440, -8)
        context.restore()
      }

      if (frontWatermarkImage) {
        context.save()
        context.globalAlpha = 0.38
        drawContainedImage(context, frontWatermarkImage, 610, -6, 620, 440, 14)
        context.restore()
      }

      if (backWatermarkImage) {
        context.save()
        context.globalAlpha = 0.28
        drawContainedImage(context, backWatermarkImage, 760, 388, 540, 430, 14)
        context.restore()
      }

      drawSoftPanel(24, 18, 480, 122, 22, 'rgba(255, 255, 255, 0.96)', 24)

      if (logoImage) {
        drawContainedImage(context, logoImage, -6, -8, 170, 170)
      }

      const titleX = 188
      const titleY = 56
      let titleFontSize = 34
      while (titleFontSize > 24) {
        context.font = `700 ${titleFontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
        if (context.measureText(quoteHeaderName).width <= 286) {
          break
        }
        titleFontSize -= 1
      }
      context.fillStyle = '#111827'
      context.textBaseline = 'top'
      context.fillText(quoteHeaderName, titleX, titleY)

      let pillX = titleX
      const pillY = 101
      ;[selection.garmentLabel, `${selection.quantity} pieces`, quotePlacementSummary].forEach((text, index) => {
        const pillWidth = drawPill(pillX, pillY, text)
        pillX += pillWidth + (index < 2 ? 10 : 0)
      })

      if (frontShirtImage) {
        drawMockupCard({
          shirtImage: frontShirtImage,
          shirtBounds: frontShirtBounds,
          overlayImageMap: overlayImages,
          cardX: 88,
          cardY: 152,
          cardWidth: 410,
          cardHeight: 450,
          cardRotation: -5,
          view: 'front',
        })
      }

      if (backShirtImage) {
        drawMockupCard({
          shirtImage: backShirtImage,
          shirtBounds: backShirtBounds,
          overlayImageMap: overlayImages,
          cardX: 678,
          cardY: 152,
          cardWidth: 410,
          cardHeight: 450,
          cardRotation: 5,
          view: 'back',
        })
      }

      drawCaptionPill(344, 575, 'FRONT')
      drawCaptionPill(847, 575, 'BACK')

      drawSoftPanel(20, 660, 1140, 140, 28, 'rgba(255, 255, 255, 0.96)', 20)

      const infoColumns = [
        { x: 40, label: 'GARMENT', value: selection.garmentLabel, note: selection.garmentNote, width: 320 },
        { x: 400, label: 'PRICE PER GARMENT', value: formatMoney(selection.unitPrice), width: 220 },
        { x: 655, label: 'QUANTITY', value: String(selection.quantity), width: 160 },
        { x: 910, label: 'TOTAL PRICE', value: formatMoney(selection.customerPrice), width: 220 },
      ]

      infoColumns.forEach(({ x, label, value, note, width }) => {
        context.save()
        context.textBaseline = 'top'
        context.fillStyle = 'rgba(17, 24, 39, 0.7)'
        context.font = miniLabelFont
        context.fillText(label, x, 682)
        context.fillStyle = '#111827'
        context.font = '700 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
        context.fillText(value, x, 718)
        if (note) {
          context.fillStyle = 'rgba(17, 24, 39, 0.8)'
          context.font = '500 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
          drawWrappedText(note, x, 756, width, 20, 3)
        }
        context.restore()
      })

      return await canvasToBlob(canvas, 'image/jpeg', 0.95)
    } catch (error) {
      console.error('Unable to build quote mock JPG.', error)
      return null
    }
  }

  const downloadQuoteMockJpg = (blob) => {
    const objectUrl = URL.createObjectURL(blob)

    if (/iPad|iPhone|iPod/.test(window.navigator.userAgent)) {
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
      return
    }

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = quoteMockFileName
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  const handleQuoteMockDownload = async () => {
    setIsQuoteMockExporting(true)

    try {
      const blob = await buildQuoteMockJpgBlob()

      if (blob) {
        downloadQuoteMockJpg(blob)
      }
    } catch (error) {
      console.error('Unable to build quote mock JPG.', error)
    } finally {
      setIsQuoteMockExporting(false)
    }
  }

  const handleQuoteMockShare = async () => {
    setIsQuoteMockExporting(true)

    try {
      const blob = await buildQuoteMockJpgBlob()

      if (!blob) {
        return
      }

      if (!navigator.share) {
        downloadQuoteMockJpg(blob)
        return
      }

      const file = new File([blob], quoteMockFileName, { type: 'image/jpeg' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${selection.garmentLabel} quote`,
          text: `${selection.garmentLabel} quote mock`,
          files: [file],
        })
        return
      }

      downloadQuoteMockJpg(blob)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        const fallbackBlob = await buildQuoteMockJpgBlob()

        if (fallbackBlob) {
          downloadQuoteMockJpg(fallbackBlob)
        }
      }
    } finally {
      setIsQuoteMockExporting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="studio-shell">
        <article className="glass-panel hero-panel">
          <div className="hero-copy">
            <div className="hero-kicker-row">
              <span className="panel-kicker">
                DTF Apparel Pricer <span className="version-badge">{APP_VERSION}</span>
              </span>
            </div>
            <div className="hero-customer-row">
              <label className="field hero-customer-field">
                <span>Customer name</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Enter customer name"
                />
              </label>
            </div>
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
              <span>Quantity</span>
              <input
                className="quantity-step-input"
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={handleQuantityChange}
                placeholder="24"
              />
            </label>

            <label className="field preview-control-field">
              <span>Quantity tier</span>
              <select
                className="spotlight-control garment-select"
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
                  {sharedFrontGraphic ? (
                    <div className="graphic-size-controls" aria-label="Adjust front graphic size">
                      <button
                        type="button"
                        className="size-adjust-button"
                        onClick={handleGraphicSizeAdjust(activeFrontField, 'decrease')}
                        aria-label="Make front graphic slightly smaller"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="size-adjust-button"
                        onClick={handleGraphicSizeAdjust(activeFrontField, 'increase')}
                        aria-label="Make front graphic slightly larger"
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                  {sharedFrontGraphic ? (
                    <label className="background-toggle">
                      <input
                        type="checkbox"
                        checked={backgroundRemoval.leftBreast}
                        onChange={handleFrontBackgroundToggle}
                      />
                      <span>Remove background</span>
                    </label>
                  ) : null}
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
                  {graphics.leftSleeve ? (
                    <div className="graphic-size-controls" aria-label="Adjust left sleeve graphic size">
                      <button
                        type="button"
                        className="size-adjust-button"
                        onClick={handleGraphicSizeAdjust('leftSleeve', 'decrease')}
                        aria-label="Make left sleeve graphic slightly smaller"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="size-adjust-button"
                        onClick={handleGraphicSizeAdjust('leftSleeve', 'increase')}
                        aria-label="Make left sleeve graphic slightly larger"
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                  {graphics.leftSleeve ? (
                    <label className="background-toggle">
                      <input
                        type="checkbox"
                        checked={backgroundRemoval.leftSleeve}
                        onChange={handleGraphicBackgroundToggle('leftSleeve')}
                      />
                      <span>Remove background</span>
                    </label>
                  ) : null}
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
                  {graphics.rightSleeve ? (
                    <div className="graphic-size-controls" aria-label="Adjust right sleeve graphic size">
                      <button
                        type="button"
                        className="size-adjust-button"
                        onClick={handleGraphicSizeAdjust('rightSleeve', 'decrease')}
                        aria-label="Make right sleeve graphic slightly smaller"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="size-adjust-button"
                        onClick={handleGraphicSizeAdjust('rightSleeve', 'increase')}
                        aria-label="Make right sleeve graphic slightly larger"
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                  {graphics.rightSleeve ? (
                    <label className="background-toggle">
                      <input
                        type="checkbox"
                        checked={backgroundRemoval.rightSleeve}
                        onChange={handleGraphicBackgroundToggle('rightSleeve')}
                      />
                      <span>Remove background</span>
                    </label>
                  ) : null}
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
                  {graphics.fullBack ? (
                    <div className="graphic-size-controls" aria-label="Adjust back graphic size">
                      <button
                        type="button"
                        className="size-adjust-button"
                        onClick={handleGraphicSizeAdjust('fullBack', 'decrease')}
                        aria-label="Make back graphic slightly smaller"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="size-adjust-button"
                        onClick={handleGraphicSizeAdjust('fullBack', 'increase')}
                        aria-label="Make back graphic slightly larger"
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                  {graphics.fullBack ? (
                    <label className="background-toggle">
                      <input
                        type="checkbox"
                        checked={backgroundRemoval.fullBack}
                        onChange={handleGraphicBackgroundToggle('fullBack')}
                      />
                      <span>Remove background</span>
                    </label>
                  ) : null}
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
            <div className="quote-mock-actions">
              <div className="pricing-preset-group" aria-label="Pricing aggressiveness">
                {Object.entries(PRICING_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    className={`pricing-preset-button ${
                      pricingPresetKey === key ? 'active' : ''
                    }`}
                    onClick={() => setPricingPresetKey(key)}
                    aria-pressed={pricingPresetKey === key}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <label className="field quote-background-field">
                <span>Mock background</span>
                <select
                  className="spotlight-control"
                  value={quoteBackground}
                  onChange={(event) => setQuoteBackground(event.target.value)}
                >
                  {QUOTE_BACKGROUNDS.map((background) => (
                    <option key={background.value} value={background.value}>
                      {background.label}
                    </option>
                  ))}
                </select>
              </label>
              {isQuoteMockVisible ? (
                <>
                  <button
                    type="button"
                    className="quote-mock-button"
                    onClick={handleQuoteMockDownload}
                    disabled={isQuoteMockExporting}
                  >
                    {isQuoteMockExporting ? 'Building JPG...' : 'Download JPG'}
                  </button>
                  <button
                    type="button"
                    className="quote-mock-button"
                    onClick={handleQuoteMockShare}
                    disabled={isQuoteMockExporting}
                  >
                    {isQuoteMockExporting ? 'Building JPG...' : 'Share JPG'}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="quote-mock-button"
                onClick={() => setIsQuoteMockVisible((current) => !current)}
              >
                {isQuoteMockVisible ? 'Hide mock with pricing' : 'Generate mock with pricing'}
              </button>
            </div>
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
              <strong>{selection.effectiveMultiplier.toFixed(2)}x</strong>
            </div>
            <div>
              <p className="mini-label">Suggested sale price</p>
              <strong>{formatMoney(selection.unitPrice)}</strong>
            </div>
            <div>
              <p className="mini-label">Price</p>
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
              ref={quoteMockRef}
              className="quote-mock-sheet"
              style={{
                '--quote-accent': quoteAccentCss,
                '--quote-base': quoteBaseCss,
                '--quote-hue': `${quoteHueRotation}deg`,
              }}
            >
              <img
                src={quoteBackgroundSrc}
                alt=""
                aria-hidden="true"
                className="quote-mock-background"
              />
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
                  <h2>{quoteHeaderName}</h2>
                  <div className="quote-mock-title-meta">
                    <p>{selection.garmentLabel}</p>
                    <p>{selection.quantity} pieces</p>
                    <p>{quotePlacementSummary}</p>
                  </div>
                </div>
              </div>

              <div className="quote-mock-body">
                <div className="quote-mock-garments">
                  <figure className="quote-mock-card">
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
                    <figcaption>Front</figcaption>
                  </figure>

                  <figure className="quote-mock-card">
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
                    <figcaption>Back</figcaption>
                  </figure>
                </div>
              </div>

              <div className="quote-mock-info-bar">
                <div className="quote-mock-info-item quote-mock-footer-type">
                  <span className="mini-label">Garment</span>
                  <strong>{selection.garmentLabel}</strong>
                  <p>{selection.garmentNote}</p>
                </div>
                <div className="quote-mock-info-item">
                  <span className="mini-label">Price per garment</span>
                  <strong>{formatMoney(selection.unitPrice)}</strong>
                </div>
                <div className="quote-mock-info-item">
                  <span className="mini-label">Quantity</span>
                  <strong>{selection.quantity}</strong>
                </div>
                <div className="quote-mock-info-item">
                  <span className="mini-label">Total price</span>
                  <strong>{formatMoney(selection.customerPrice)}</strong>
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
