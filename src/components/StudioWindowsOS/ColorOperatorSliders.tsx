import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import css from './ColorOperatorSliders.module.css'
import StudioTooltip from './StudioTooltip'
import { COLOR_OPERATOR_TOOLTIPS } from './colorOperatorTooltips'
import {
  bindThemeColorOperators,
  HUE_OPERATOR_MAX,
  HUE_OPERATOR_MIN,
  readThemeOperatorsFromDocument,
  applyThemeOperatorsToSliders,
  type ThemeSliderElements,
} from './themeColorOperators'
import { sliderStopPercent } from './themeOperatorMapping'

type OperatorNumberInputProps = {
  inputRef: RefObject<HTMLInputElement | null>
  sliderRef: RefObject<HTMLInputElement | null>
  unit: string
  min: number
  max: number
  step: number
  ariaLabel: string
}

function roundToStep(value: number, step: number): number {
  const decimals = String(step).includes('.') ? String(step).split('.')[1]?.length ?? 0 : 0
  const rounded = Math.round(value / step) * step
  return Number(rounded.toFixed(decimals))
}

function sliderIntervalTicks(min: number, max: number, step: number): number[] {
  const decimals = String(step).includes('.') ? String(step).split('.')[1]?.length ?? 0 : 0
  let value = roundToStep(min, step)
  const end = roundToStep(max, step)
  const ticks: number[] = []
  while (value <= end + step / 2) {
    ticks.push(Number(value.toFixed(decimals)))
    value = Number((value + step).toFixed(decimals))
  }
  return ticks
}

type SliderWithTicksProps = {
  sliderRef: RefObject<HTMLInputElement | null>
  id: string
  className: string
  min: number
  max: number
  step: number
  defaultValue: number
  stops: number[]
  showStopTicks: boolean
  tabIndex?: number
  ariaHidden?: boolean
}

function SliderWithTicks({
  sliderRef,
  id,
  className,
  min,
  max,
  step,
  defaultValue,
  stops,
  showStopTicks,
  tabIndex,
  ariaHidden,
}: SliderWithTicksProps) {
  return (
    <div className={css.sliderTrackWrap}>
      {showStopTicks && stops.length > 0 ? (
        <div className={css.sliderTicks} aria-hidden>
          {stops.map((stop) => (
            <span
              key={stop}
              className={css.sliderTick}
              style={{ left: `${sliderStopPercent(stop, min, max)}%` }}
            />
          ))}
        </div>
      ) : null}
      <input
        ref={sliderRef}
        type="range"
        id={id}
        className={className}
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        tabIndex={tabIndex}
        aria-hidden={ariaHidden}
      />
    </div>
  )
}

function OperatorNumberInput({
  inputRef,
  sliderRef,
  unit,
  min,
  max,
  step,
  ariaLabel,
}: OperatorNumberInputProps) {
  const [sliderValue, setSliderValue] = useState(min)

  useEffect(() => {
    const slider = sliderRef.current
    if (slider == null) return undefined
    const onSliderInput = () => setSliderValue(Number(slider.value))
    onSliderInput()
    slider.addEventListener('input', onSliderInput)
    return () => slider.removeEventListener('input', onSliderInput)
  }, [sliderRef])

  const steppedValue = roundToStep(sliderValue, step)
  const decreaseDisabled = steppedValue <= min
  const increaseDisabled = steppedValue >= max

  const commitValue = () => {
    const slider = sliderRef.current
    const input = inputRef.current
    if (!slider || !input) return

    const parsed = Number(String(input.value).replace(/^\+/, ''))
    if (!Number.isFinite(parsed)) {
      input.value = slider.value
      return
    }

    const clamped = Math.min(max, Math.max(min, roundToStep(parsed, step)))
    slider.value = String(clamped)
    slider.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const nudge = (direction: -1 | 1) => {
    const slider = sliderRef.current
    if (!slider) return
    if (direction === -1 && decreaseDisabled) return
    if (direction === 1 && increaseDisabled) return
    const next = roundToStep(Number(slider.value) + direction * step, step)
    const clamped = Math.min(max, Math.max(min, next))
    if (clamped === Number(slider.value)) return
    slider.value = String(clamped)
    slider.dispatchEvent(new Event('input', { bubbles: true }))
  }

  return (
    <div className={css.numberInput}>
      <div className={css.numberInputField}>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className={css.numberInputValue}
          aria-label={ariaLabel}
          onBlur={commitValue}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitValue()
              inputRef.current?.blur()
            }
          }}
        />
        <span className={css.numberInputUnit} aria-hidden>
          {unit}
        </span>
      </div>
      <div className={css.numberInputSteppers}>
        <button
          type="button"
          className={css.stepperBtn}
          aria-label={`Decrease ${ariaLabel}`}
          disabled={decreaseDisabled}
          onClick={() => nudge(-1)}
        >
          −
        </button>
        <button
          type="button"
          className={css.stepperBtn}
          aria-label={`Increase ${ariaLabel}`}
          disabled={increaseDisabled}
          onClick={() => nudge(1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

export type ColorOperatorId = 'hue' | 'saturation' | 'lightness' | 'contrast'

const ALL_OPERATORS: readonly ColorOperatorId[] = [
  'hue',
  'saturation',
  'lightness',
  'contrast',
]

export type ColorOperatorSlidersHandle = {
  getElements: () => ThemeSliderElements | null
}

const DEFAULT_SAT_MIN = 0
const DEFAULT_SAT_MAX = 2

export type ColorOperatorSlidersProps = {
  idPrefix?: string
  className?: string
  /** Hidden operators still sync to `:root` for theme presets. Defaults to all four. */
  visibleOperators?: readonly ColorOperatorId[]
  /** Saturation multiplier bounds. Default 0–2; theme spectrum uses a tighter theme-derived range. */
  satMin?: number
  satMax?: number
  /** Contrast multiplier bounds. Default 0.5–1.5 (prototype); Studio Settings uses a tighter range. */
  contrastMin?: number
  contrastMax?: number
  /** Tick marks at each slider step (whole numbers or tenths). */
  showStopTicks?: boolean
}

const DEFAULT_CONTRAST_MIN = 0.5
const DEFAULT_CONTRAST_MAX = 1.5

const ColorOperatorSliders = forwardRef<ColorOperatorSlidersHandle, ColorOperatorSlidersProps>(
  function ColorOperatorSliders(
    {
      idPrefix = 'color-operators',
      className,
      visibleOperators = ALL_OPERATORS,
      satMin = DEFAULT_SAT_MIN,
      satMax = DEFAULT_SAT_MAX,
      contrastMin = DEFAULT_CONTRAST_MIN,
      contrastMax = DEFAULT_CONTRAST_MAX,
      showStopTicks = false,
    },
    ref,
  ) {
    const hueSliderRef = useRef<HTMLInputElement>(null)
    const satSliderRef = useRef<HTMLInputElement>(null)
    const lightSliderRef = useRef<HTMLInputElement>(null)
    const contrastSliderRef = useRef<HTMLInputElement>(null)
    const hueReadoutRef = useRef<HTMLInputElement>(null)
    const satReadoutRef = useRef<HTMLInputElement>(null)
    const lightReadoutRef = useRef<HTMLInputElement>(null)
    const contrastReadoutRef = useRef<HTMLInputElement>(null)

    const getSliderElements = useCallback((): ThemeSliderElements | null => {
      const hueSlider = hueSliderRef.current
      const satSlider = satSliderRef.current
      const lightSlider = lightSliderRef.current
      const contrastSlider = contrastSliderRef.current
      if (!hueSlider || !satSlider || !lightSlider || !contrastSlider) return null
      return {
        hueSlider,
        satSlider,
        lightSlider,
        contrastSlider,
        hueReadout: hueReadoutRef.current,
        satReadout: satReadoutRef.current,
        lightReadout: lightReadoutRef.current,
        contrastReadout: contrastReadoutRef.current,
      }
    }, [])

    useImperativeHandle(ref, () => ({ getElements: getSliderElements }), [getSliderElements])

    useLayoutEffect(() => {
      const elements = getSliderElements()
      if (!elements) return
      applyThemeOperatorsToSliders(elements, readThemeOperatorsFromDocument())
    }, [getSliderElements])

    useEffect(() => {
      const elements = getSliderElements()
      if (!elements) return undefined
      return bindThemeColorOperators(elements)
    }, [getSliderElements])

    const hueId = `${idPrefix}-hue`
    const satId = `${idPrefix}-sat`
    const lightId = `${idPrefix}-light`
    const contrastId = `${idPrefix}-contrast`

    const showHue = visibleOperators.includes('hue')
    const showSaturation = visibleOperators.includes('saturation')
    const showLightness = visibleOperators.includes('lightness')
    const showContrast = visibleOperators.includes('contrast')

    const hueStops = sliderIntervalTicks(HUE_OPERATOR_MIN, HUE_OPERATOR_MAX, 1)
    const satStops = sliderIntervalTicks(satMin, satMax, 0.1)
    const lightStops = sliderIntervalTicks(-10, 10, 1)
    const contrastStops = sliderIntervalTicks(contrastMin, contrastMax, 0.1)

    return (
      <div className={`${css.sliders} ${className ?? ''}`.trim()}>
        {showHue ? (
          <div className={css.sliderRow}>
            <StudioTooltip
              title={COLOR_OPERATOR_TOOLTIPS.hue.title}
              description={COLOR_OPERATOR_TOOLTIPS.hue.description}
              className={css.sliderLabelHost}
            >
              <label className={css.sliderLabel} htmlFor={hueId}>
                Hue
              </label>
            </StudioTooltip>
            <div className={css.sliderValueGroup}>
              <div className={css.sliderControl}>
                <SliderWithTicks
                  sliderRef={hueSliderRef}
                  id={hueId}
                  className={css.slider}
                  min={HUE_OPERATOR_MIN}
                  max={HUE_OPERATOR_MAX}
                  step={1}
                  defaultValue={0}
                  stops={hueStops}
                  showStopTicks={showStopTicks}
                />
              </div>
              <OperatorNumberInput
                inputRef={hueReadoutRef}
                sliderRef={hueSliderRef}
                unit="°"
                min={HUE_OPERATOR_MIN}
                max={HUE_OPERATOR_MAX}
                step={1}
                ariaLabel="Hue"
              />
            </div>
          </div>
        ) : (
          <input
            ref={hueSliderRef}
            type="range"
            id={hueId}
            className={css.hiddenOperator}
            min={HUE_OPERATOR_MIN}
            max={HUE_OPERATOR_MAX}
            step={1}
            defaultValue={0}
            tabIndex={-1}
            aria-hidden
          />
        )}
        {showSaturation ? (
          <div className={css.sliderRow}>
            <StudioTooltip
              title={COLOR_OPERATOR_TOOLTIPS.saturation.title}
              description={COLOR_OPERATOR_TOOLTIPS.saturation.description}
              className={css.sliderLabelHost}
            >
              <label className={css.sliderLabel} htmlFor={satId}>
                Saturation
              </label>
            </StudioTooltip>
            <div className={css.sliderValueGroup}>
              <div className={css.sliderControl}>
                <SliderWithTicks
                  sliderRef={satSliderRef}
                  id={satId}
                  className={css.slider}
                  min={satMin}
                  max={satMax}
                  step={0.01}
                  defaultValue={1}
                  stops={satStops}
                  showStopTicks={showStopTicks}
                />
              </div>
              <OperatorNumberInput
                inputRef={satReadoutRef}
                sliderRef={satSliderRef}
                unit="x"
                min={satMin}
                max={satMax}
                step={0.01}
                ariaLabel="Saturation"
              />
            </div>
          </div>
        ) : (
          <input
            ref={satSliderRef}
            type="range"
            id={satId}
            className={css.hiddenOperator}
            min={satMin}
            max={satMax}
            step={0.01}
            defaultValue={1}
            tabIndex={-1}
            aria-hidden
          />
        )}
        {showLightness ? (
          <div className={css.sliderRow}>
            <StudioTooltip
              title={COLOR_OPERATOR_TOOLTIPS.lightness.title}
              description={COLOR_OPERATOR_TOOLTIPS.lightness.description}
              className={css.sliderLabelHost}
            >
              <label className={css.sliderLabel} htmlFor={lightId}>
                Lightness
              </label>
            </StudioTooltip>
            <div className={css.sliderValueGroup}>
              <div className={css.sliderControl}>
                <SliderWithTicks
                  sliderRef={lightSliderRef}
                  id={lightId}
                  className={css.slider}
                  min={-10}
                  max={10}
                  step={1}
                  defaultValue={0}
                  stops={lightStops}
                  showStopTicks={showStopTicks}
                />
              </div>
              <OperatorNumberInput
                inputRef={lightReadoutRef}
                sliderRef={lightSliderRef}
                unit="%"
                min={-10}
                max={10}
                step={1}
                ariaLabel="Lightness"
              />
            </div>
          </div>
        ) : (
          <input
            ref={lightSliderRef}
            type="range"
            id={lightId}
            className={css.hiddenOperator}
            min={-10}
            max={10}
            step={1}
            defaultValue={0}
            tabIndex={-1}
            aria-hidden
          />
        )}
        {showContrast ? (
          <div className={css.sliderRow}>
            <StudioTooltip
              title={COLOR_OPERATOR_TOOLTIPS.contrast.title}
              description={COLOR_OPERATOR_TOOLTIPS.contrast.description}
              className={css.sliderLabelHost}
            >
              <label className={css.sliderLabel} htmlFor={contrastId}>
                Contrast
              </label>
            </StudioTooltip>
            <div className={css.sliderValueGroup}>
              <div className={css.sliderControl}>
                <SliderWithTicks
                  sliderRef={contrastSliderRef}
                  id={contrastId}
                  className={css.slider}
                  min={contrastMin}
                  max={contrastMax}
                  step={0.01}
                  defaultValue={1}
                  stops={contrastStops}
                  showStopTicks={showStopTicks}
                />
              </div>
              <OperatorNumberInput
                inputRef={contrastReadoutRef}
                sliderRef={contrastSliderRef}
                unit="x"
                min={contrastMin}
                max={contrastMax}
                step={0.01}
                ariaLabel="Contrast"
              />
            </div>
          </div>
        ) : (
          <input
            ref={contrastSliderRef}
            type="range"
            id={contrastId}
            className={css.hiddenOperator}
            min={contrastMin}
            max={contrastMax}
            step={0.01}
            defaultValue={1}
            tabIndex={-1}
            aria-hidden
          />
        )}
      </div>
    )
  },
)

export default ColorOperatorSliders
