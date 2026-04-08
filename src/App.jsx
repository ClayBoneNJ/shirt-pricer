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
const APP_VERSION = 'v6'

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

const WHITE_BACKGROUND_THRESHOLD = 190
const WHITE_BACKGROUND_SOFTNESS = 70

const clampNumber = (value) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

const sanitizeIntegerInput = (value) => value.replace(/\D/g, '')

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

const isNearWhitePixel = (data, index) => {
  const red = data[index]
  const green = data[index + 1]
  const blue = data[index + 2]
  const brightestChannel = Math.max(red, green, blue)
  const darkestChannel = Math.min(red, green, blue)

  return (
    brightestChannel >= WHITE_BACKGROUND_THRESHOLD &&
    brightestChannel - darkestChannel <= WHITE_BACKGROUND_SOFTNESS
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

    if (!isNearWhitePixel(data, dataIndex)) {
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
    const brightestChannel = Math.max(red, green, blue)
    const alphaRatio = Math.min(
      1,
      Math.max(0, (255 - brightestChannel) / WHITE_BACKGROUND_SOFTNESS),
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
    }
  }, [form])

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

        <section className="focus-grid">
          <article className="glass-panel focus-panel garment-panel">
            <div className="section-heading">
              <span className="panel-kicker">Garment</span>
              <h2>Pick the blank</h2>
              <p>
                Start with the garment choice, then let the layout follow the job.
              </p>
            </div>

            <label className="field field-stack">
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

            <label className="field field-stack">
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

            <label className="field field-stack">
              <span>Actual quantity</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.quantity}
                onChange={handleQuantityChange}
                placeholder="24"
              />
            </label>

            <div className="glass-band garment-preview">
              <div>
                <p className="mini-label">Selected garment</p>
                <strong>{selection.garmentLabel}</strong>
              </div>
              <div>
                <p className="mini-label">Garment color</p>
                <strong>{selection.shirtColor.label}</strong>
              </div>
              <div>
                <p className="mini-label">Quantity tier</p>
                <strong>{selection.quantityTier.label}</strong>
              </div>
              <div>
                <p className="mini-label">Actual quantity</p>
                <strong>{selection.quantity}</strong>
              </div>
              <div>
                <p className="mini-label">Default blank cost</p>
                <strong>{formatMoney(selection.blankCost)}</strong>
              </div>
              <div>
                <p className="mini-label">Tier multiplier</p>
                <strong>{selection.quantityTier.multiplier.toFixed(2)}x</strong>
              </div>
            </div>

            <div className="glass-band pricing-band">
              <div>
                <p className="mini-label">Unit cost</p>
                <strong>{formatMoney(selection.unitCost)}</strong>
              </div>
              <div>
                <p className="mini-label">Sell price</p>
                <strong>{formatMoney(selection.unitPrice)}</strong>
              </div>
            </div>

            <p className="garment-note">{selection.garmentNote}</p>
          </article>

          <article className="glass-panel focus-panel deco-panel">
            <div className="section-heading">
              <span className="panel-kicker">Decoration</span>
              <h2>Build the layout</h2>
              <p>
                Turn on the placements you need and the layout cost updates
                instantly.
              </p>
            </div>

            <div className="layout-summary-pills">
              <span className="summary-pill">
                Active locations <strong>{selection.activeDecorations.length}</strong>
              </span>
              <span className="summary-pill">
                Layout cost <strong>{formatMoney(selection.decorationCost)}</strong>
              </span>
              <span className="summary-pill">
                Unit price <strong>{formatMoney(selection.unitPrice)}</strong>
              </span>
            </div>

            <div className="toggle-grid">
              <label className="toggle-card">
                <input
                  type="checkbox"
                  checked={form.printLocations.leftBreast}
                  onChange={handlePrintToggle('leftBreast')}
                />
                <span>Left Breast</span>
                <small>{formatMoney(selection.leftBreastCost)} each</small>
                <div
                  className="upload-row"
                  onClick={(event) => event.stopPropagation()}
                >
                  <label className="upload-button">
                    Upload graphic
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGraphicUpload('leftBreast')}
                    />
                  </label>
                  <small className="upload-meta">
                    {graphics.leftBreast?.name ?? '4 in wide'}
                  </small>
                </div>
              </label>

              <label className="toggle-card">
                <input
                  type="checkbox"
                  checked={form.printLocations.fullFront}
                  onChange={handlePrintToggle('fullFront')}
                />
                <span>Full Front</span>
                <small>{formatMoney(selection.fullFrontCost)} each</small>
                <div
                  className="upload-row"
                  onClick={(event) => event.stopPropagation()}
                >
                  <label className="upload-button">
                    Upload graphic
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGraphicUpload('fullFront')}
                    />
                  </label>
                  <small className="upload-meta">
                    {graphics.fullFront?.name ?? '11 in wide'}
                  </small>
                </div>
              </label>

              <label className="toggle-card">
                <input
                  type="checkbox"
                  checked={form.printLocations.leftSleeve}
                  onChange={handlePrintToggle('leftSleeve')}
                />
                <span>Left Sleeve</span>
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
                  <small className="upload-meta">
                    {graphics.leftSleeve?.name ?? '4 in wide'}
                  </small>
                </div>
              </label>

              <label className="toggle-card">
                <input
                  type="checkbox"
                  checked={form.printLocations.rightSleeve}
                  onChange={handlePrintToggle('rightSleeve')}
                />
                <span>Right Sleeve</span>
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
                  <small className="upload-meta">
                    {graphics.rightSleeve?.name ?? '4 in wide'}
                  </small>
                </div>
              </label>

              <label className="toggle-card">
                <input
                  type="checkbox"
                  checked={form.printLocations.fullBack}
                  onChange={handlePrintToggle('fullBack')}
                />
                <span>Full Back</span>
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
                  <small className="upload-meta">
                    {graphics.fullBack?.name ?? '11 in wide'}
                  </small>
                </div>
              </label>
            </div>

            <div className="glass-band active-layout">
              <span className="mini-label">Current layout</span>
              <div className="active-tags">
                {selection.activeDecorations.length ? (
                  selection.activeDecorations.map((item) => (
                    <span key={item} className="active-tag">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="active-tag muted">No decoration selected</span>
                )}
              </div>
              {selection.minimumUnitPrice > 0 ? (
                <p className="pricing-note">
                  Minimum applied: {formatMoney(selection.minimumUnitPrice)} for this
                  layout.
                </p>
              ) : selection.unitPrice === ROCK_BOTTOM_UNIT_PRICE ? (
                <p className="pricing-note">
                  Rock-bottom floor applied: {formatMoney(ROCK_BOTTOM_UNIT_PRICE)}.
                </p>
              ) : null}
            </div>
          </article>
        </section>

        <article className="glass-panel focus-panel preview-panel">
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

          <div className="glass-band mockup-band">
            <div className="mockup-gallery">
              <figure className="mockup-stage">
                <figcaption className="mockup-caption">Front</figcaption>
                <div className="mockup-frame">
                  <div className="mockup-canvas">
                    <img
                      src={selection.shirtColor.frontImage}
                      alt={`${selection.shirtColor.label} shirt front`}
                      className="shirt-mockup-image"
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
                      className="shirt-mockup-image"
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
      </section>
    </main>
  )
}

export default App
