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
const formatAppVersion = (version) => {
  const versionParts = version.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const displayVersionNumber = versionParts[0] * 10000 + versionParts[1] * 100 + versionParts[2]

  return `v${String(displayVersionNumber).padStart(3, '0')}`
}

const APP_VERSION = formatAppVersion(packageJson.version)

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
  quantity: '5',
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

const loadImageFromSrc = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()

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

function App() {
  const [form, setForm] = useState(createDefaultForm)
  const [customerName, setCustomerName] = useState('')
  const [graphics, setGraphics] = useState(DEFAULT_GRAPHICS)
  const [graphicPlacements, setGraphicPlacements] = useState({})
  const [dragState, setDragState] = useState(null)
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false)
  const [isQuoteMockVisible, setIsQuoteMockVisible] = useState(false)
  const [quoteAccentColor, setQuoteAccentColor] = useState(hexToRgb(SHIRT_COLORS[1].hex))
  const [isQuoteMockExporting, setIsQuoteMockExporting] = useState(false)
  const [quoteBackground, setQuoteBackground] = useState(QUOTE_BACKGROUNDS[0].value)
  const quoteMockRef = useRef(null)
  const colorPickerRef = useRef(null)

  const selection = useMemo(() => {
    const blankCost = clampNumber(form.blankCost)
    const quantity = Math.max(1, clampNumber(form.quantity || 0))
    const leftBreastCost = clampNumber(form.transferPrices.leftBreast)
    const fullFrontCost = clampNumber(form.transferPrices.fullFront)
    const fullBackCost = clampNumber(form.transferPrices.fullBack)
    const sleeveCost = clampNumber(form.transferPrices.sleeve)
    const quantityTier = getQuantityTierForQuantity(quantity) ?? PRICING_CONFIG.quantityBreaks[0]
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
  const quoteBackgroundConfig =
    QUOTE_BACKGROUNDS.find((background) => background.value === quoteBackground) ??
    QUOTE_BACKGROUNDS[0]
  const quoteHueRotation = rgbToHue(quoteAccentColor) - quoteBackgroundConfig.baseHue
  const shirtMockupClassName = `shirt-mockup-image${
    form.shirtColor === 'white' ? ' shirt-mockup-image-white' : ''
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

    const isRasterUpload =
      /image\/jpeg|image\/jpg|image\/png|image\/webp/i.test(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name)

    let graphicUrl

    try {
      graphicUrl = isRasterUpload ? await removeBackgroundFromRaster(file) : URL.createObjectURL(file)
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

    const isRasterUpload =
      /image\/jpeg|image\/jpg|image\/png|image\/webp/i.test(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name)

    let graphicUrl

    try {
      graphicUrl = isRasterUpload ? await removeBackgroundFromRaster(file) : URL.createObjectURL(file)
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

  const buildQuoteMockJpgBlob = async () => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      return null
    }

    const exportWidth = 1800
    const exportHeight = 1320
    canvas.width = exportWidth
    canvas.height = exportHeight

    const graphicImages = Object.fromEntries(
      await Promise.all(
        Object.entries(graphics).map(async ([field, graphic]) => [
          field,
          graphic?.url ? await loadImageFromSrc(graphic.url) : null,
        ]),
      ),
    )

    const [
      backgroundImage,
      companyLogoImage,
      shirtFrontImage,
      shirtBackImage,
      logoWatermarkImage,
      frontWatermarkImage,
      backWatermarkImage,
    ] = await Promise.all([
      loadImageFromSrc(quoteBackgroundSrc),
      loadImageFromSrc(`${ASSET_BASE_URL}company-logo.png`),
      loadImageFromSrc(selection.shirtColor.frontImage),
      loadImageFromSrc(selection.shirtColor.backImage),
      loadImageFromSrc(`${ASSET_BASE_URL}company-logo.png`),
      mockFrontGraphic ? loadImageFromSrc(mockFrontGraphic.url) : Promise.resolve(null),
      mockBackGraphic ? loadImageFromSrc(mockBackGraphic.url) : Promise.resolve(null),
    ])

    const shirtFrontBounds = getOpaqueImageBounds(shirtFrontImage)
    const shirtBackBounds = getOpaqueImageBounds(shirtBackImage)

    context.fillStyle = '#111827'
    context.fillRect(0, 0, exportWidth, exportHeight)

    drawRoundedRect(context, 0, 0, exportWidth, exportHeight, 44)
    context.save()
    context.clip()
    const adjustedBackgroundImage = getAdjustedBackgroundCanvas(backgroundImage, exportWidth, exportHeight, {
      hueRotation: quoteHueRotation,
      saturation: 1.35,
      brightness: 0.72,
      contrast: 1.08,
    })
    context.drawImage(adjustedBackgroundImage, 0, 0, exportWidth, exportHeight)
    context.fillStyle = 'rgba(8, 14, 22, 0.54)'
    context.fillRect(0, 0, exportWidth, exportHeight)

    context.globalAlpha = 0.14
    drawContainedImage(context, logoWatermarkImage, -120, exportHeight - 480, 760, 520, -8)
    context.globalAlpha = 0.32
    if (frontWatermarkImage) {
      drawContainedImage(context, frontWatermarkImage, exportWidth - 760, -120, 1040, 620, 14)
    }
    context.globalAlpha = 0.24
    if (backWatermarkImage) {
      drawContainedImage(
        context,
        backWatermarkImage,
        exportWidth - 560,
        exportHeight - 370,
        760,
        460,
        14,
      )
    }
    context.globalAlpha = 1

    context.drawImage(companyLogoImage, 70, 70, 240, 240)

    context.fillStyle = '#f8fafc'
    context.font = '700 64px Arial'
    context.textBaseline = 'top'
    context.fillText(quoteHeaderName, 328, 90)

    context.fillStyle = 'rgba(226, 232, 240, 0.88)'
    context.font = '500 30px Arial'
    context.fillText(selection.garmentLabel, 328, 172)
    context.fillText(`${selection.quantity} pieces`, 328, 214)
    context.fillText(quotePlacementSummary, 328, 256)

    const frontStage = { x: 90, y: 300, width: 860, height: 760, rotation: -5 }
    const backStage = { x: 850, y: 300, width: 860, height: 760, rotation: 5 }

    drawContainedImage(
      context,
      shirtFrontImage,
      frontStage.x,
      frontStage.y,
      frontStage.width,
      frontStage.height,
      frontStage.rotation,
      shirtFrontBounds,
    )
    drawContainedImage(
      context,
      shirtBackImage,
      backStage.x,
      backStage.y,
      backStage.width,
      backStage.height,
      backStage.rotation,
      shirtBackBounds,
    )

    const drawPlacedGraphic = (image, view, field) => {
      if (!image) {
        return
      }

      const placement = graphicPlacements[field] ?? GRAPHIC_LAYOUTS[field]
      const stage = view === 'front' ? frontStage : backStage
      const width = stage.width * (placement.width / 100)
      const x = stage.x + stage.width * (placement.x / 100)
      const y = stage.y + stage.height * (placement.y / 100)

      drawOverlayImage(context, image, x, y, width, placement.rotation + stage.rotation)
    }

    Object.entries(GRAPHIC_LAYOUTS).forEach(([field, config]) => {
      if (config.view !== 'front' || !form.printLocations[field] || !graphics[field]) {
        return
      }

      drawPlacedGraphic(graphicImages[field], 'front', field)
    })

    Object.entries(GRAPHIC_LAYOUTS).forEach(([field, config]) => {
      if (config.view !== 'back' || !form.printLocations[field] || !graphics[field]) {
        return
      }

      drawPlacedGraphic(graphicImages[field], 'back', field)
    })

    context.fillStyle = 'rgba(226, 232, 240, 0.82)'
    context.font = '700 24px Arial'
    context.textAlign = 'center'
    context.fillText('Front', 520, 1088)
    context.fillText('Back', 1280, 1088)

    const infoPillY = exportHeight - 228
    const infoPillHeight = 156

    drawRoundedRect(context, 70, infoPillY, exportWidth - 140, infoPillHeight, 28)
    context.fillStyle = 'rgba(255, 255, 255, 0.96)'
    context.fill()

    const infoColumns = [
      { label: 'GARMENT', value: selection.garmentLabel, note: selection.garmentNote, x: 120, width: 430 },
      { label: 'PRICE PER GARMENT', value: formatMoney(selection.unitPrice), x: 610, width: 290 },
      { label: 'QUANTITY', value: String(selection.quantity), x: 980, width: 210 },
      { label: 'TOTAL PRICE', value: formatMoney(selection.customerPrice), x: 1290, width: 360 },
    ]

    infoColumns.forEach((item) => {
      const hasNote = Boolean(item.note)
      const valueY = hasNote ? infoPillY + 64 : infoPillY + 86
      const noteY = hasNote ? infoPillY + 116 : infoPillY + 118

      context.textAlign = 'left'
      context.fillStyle = 'rgba(55, 65, 81, 0.72)'
      context.font = '700 18px Arial'
      context.fillText(item.label, item.x, infoPillY + 34)
      context.fillStyle = '#111827'
      context.font = '700 44px Arial'
      context.fillText(item.value, item.x, valueY)

      if (hasNote) {
        context.fillStyle = 'rgba(55, 65, 81, 0.8)'
        context.font = '400 16px Arial'
        const noteLines = []
        const words = item.note.split(' ')
        let currentLine = ''

        words.forEach((word) => {
          const candidate = currentLine ? `${currentLine} ${word}` : word

          if (context.measureText(candidate).width <= item.width) {
            currentLine = candidate
            return
          }

          if (currentLine) {
            noteLines.push(currentLine)
          }

          currentLine = word
        })

        if (currentLine) {
          noteLines.push(currentLine)
        }

        noteLines.slice(0, 2).forEach((line, index) => {
          context.fillText(line, item.x, noteY + index * 18)
        })
      }
    })

    context.restore()

    return canvasToBlob(canvas, 'image/jpeg', 0.95)
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
            <div className="quote-mock-actions">
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
              <strong>{selection.quantityTier.multiplier.toFixed(2)}x</strong>
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
