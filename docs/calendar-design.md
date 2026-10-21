# Calendar design rationale

Reviewed on 21 October 2026 against the supplied brief and the primary sources
linked below.

## Requirement and interpretation

The supplied technical test brief (Schedule, page 2; Design Direction, page 4)
requires a monthly calendar with previous/next controls, API `base_color` duty
colors, a completion tick or remaining-duty count, a legend **below** the
calendar, and a date-detail placeholder. Its design direction is minimalist,
mobile first, and operational. The current saturated, full-cell fill is an
implementation choice; the brief supplies no calendar mockup and does not
prescribe how much of a day must be filled.

Retaining each exact `base_color` in a clearly visible duty band inside its day
is our design interpretation of colored days. A neutral day surface gives the
date and status a stable reading background while the duty remains colored.
This interpretation preserves the supplied palette instead of silently
replacing it with preferred pastel values. Individual entry colors must remain
authoritative even when they differ from their duty legend color.

## Findings from primary sources

- Fluent uses neutral surfaces to establish hierarchy and recommends restrained
  shared-color accents. Apply that principle to the date canvas while retaining
  the supplied duty palette; adopting Fluent's palette or components is not needed.
  [Microsoft Fluent: Color](https://fluent2.microsoft.design/color)
- Color needs a visible alternative, such as text or shape. An accessible name
  alone does not satisfy this requirement for sighted people who cannot
  distinguish hues. Show the duty code as text alongside its color, and retain
  tick/count status cues. [W3C: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- Small text needs at least 4.5:1 contrast with its actual background; qualifying
  large text needs 3:1. Measure the duty band's foreground separately from the
  neutral date text rather than assuming white works on every seed color.
  [W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- Required control/state indicators need 3:1 contrast with adjacent colors.
  Keep a strong focus outline that remains visible next to each duty color.
  A colored accent need not carry meaning alone when its visible duty label
  supplies the same information.
  [W3C: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- Foreground event coloring and calendar-background highlighting are separate
  concepts in FullCalendar's official documentation. This provides a familiar
  precedent for colored duty content on a neutral calendar, not a requirement
  to install that library or proof that any particular visual style is best.
  [FullCalendar: Event Color](https://fullcalendar.io/docs/eventColor),
  [Background Events](https://fullcalendar.io/docs/background-events)
- W3C's illustrative date-picker example provides keyboard operation, an
  announced month heading, and visible focus borders. Its modal/grid keyboard
  model is not automatically appropriate for this schedule, whose dates are
  navigation links. Keep native links and labelled native Month/Year selects;
  avoid adding grid roles without implementing their complete interaction
  model. [W3C: Date Picker Example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)
- WCAG 2.2 defines a 24-by-24 CSS-pixel minimum pointer target with exceptions;
  larger targets can be easier to use. Keep the whole date cell interactive
  and aim for 44-pixel controls where the layout permits.
  [W3C: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

## Recommended presentation

Use white or quiet neutral day surfaces, navy date numerals, and a compact
duty band containing the exact API color, visible duty code, and base name.
Keep status separate from duty type: green duty color must not imply that
logbooks are complete. Retain the API's count-based tick/remaining calculation.

Mark the configured business date with both a visible Today label and
`aria-current="date"`; keep its border distinct from keyboard focus. Unscheduled
dates stay neutral and announce that no duties are scheduled. Do not infer
leave, completion, or missing data from a blank cell.

Place the legend below the date grid inside the same calendar container at every
breakpoint. A divider separates the legend footer without creating another card.
Use a compact header with joined native month/year selects, grouped previous/next
buttons, and a separate This month action. Preserve the
Month/Year selectors, previous/next buttons, This month action, URL history,
and fresh monthly API requests. These selectors are a usability enhancement,
not an additional requirement stated in the brief.

Verify all supplied colors, text contrast, keyboard navigation, narrow-screen
reflow, legend placement, and the Today/completion/remaining distinctions in a
real browser. Research supports the accessibility constraints; the restrained
composition remains a product design decision that needs visual review.
