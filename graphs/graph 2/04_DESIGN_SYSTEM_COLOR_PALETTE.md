# Traffic System Visual Assets
## Design System & Color Palette Guide

Professional color schemes, typography, and styling guidelines for consistent visuals.

---

## 1. CORE COLOR PALETTE

### Primary Colors (Use for main elements)

```
🔵 Official Blue (Authority, Trust, Data)
  Dark:    #1E3A8A  RGB(30, 58, 138)     [Use for: Headings, Primary buttons, Charts]
  Normal:  #3B82F6  RGB(59, 130, 246)    [Use for: Interactive elements, Links]
  Light:   #DBEAFE  RGB(219, 238, 254)   [Use for: Backgrounds, Light fills]

🟢 Success Green (Positive, Operational)
  Dark:    #065F46  RGB(6, 95, 70)       [Use for: Confirmed status, Operational metrics]
  Normal:  #10B981  RGB(16, 185, 129)    [Use for: Success indicators, Positive bars]
  Light:   #D1FAE5  RGB(209, 250, 229)   [Use for: Green zones on maps, Success backgrounds]

🔴 Alert Red (Issues, Violations)
  Dark:    #7F1D1D  RGB(127, 29, 29)     [Use for: Dark alerts, Critical status]
  Normal:  #EF4444  RGB(239, 68, 68)     [Use for: Violations, Errors, Stop signals]
  Light:   #FEE2E2  RGB(254, 226, 226)   [Use for: Red zones on maps, Warning backgrounds]

🟡 Warning Orange (Caution, Moderate)
  Dark:    #92400E  RGB(146, 64, 14)     [Use for: Secondary alerts]
  Normal:  #F59E0B  RGB(245, 158, 11)    [Use for: Warning indicators, Moderate issues]
  Light:   #FEF3C7  RGB(254, 243, 199)   [Use for: Yellow zones on maps, Moderate backgrounds]

🟠 Secondary Orange (Processing)
  Dark:    #7C2D12  RGB(124, 45, 18)
  Normal:  #FB923C  RGB(251, 146, 60)    [Use for: In-progress states]
  Light:   #FEEDDE  RGB(254, 237, 222)

🟣 Purple (Secondary Actions)
  Dark:    #5B21B6  RGB(91, 33, 182)     [Use for: Secondary buttons, Filters]
  Normal:  #8B5CF6  RGB(139, 92, 246)
  Light:   #EDE9FE  RGB(237, 233, 254)
```

### Neutral Colors (Backgrounds, Text, Dividers)

```
⚫ Dark Gray/Black (Text)
  #1F2937  RGB(31, 41, 55)  [Primary text, dark backgrounds]
  
⚫ Medium Gray (Secondary Text)
  #6B7280  RGB(107, 114, 128)  [Secondary text, labels, disabled]

⚪ Light Gray (Backgrounds)
  #F3F4F6  RGB(243, 244, 246)  [Page background, light fills]
  #F9FAFB  RGB(249, 250, 251)  [Subtle backgrounds]

⚪ White
  #FFFFFF  RGB(255, 255, 255)  [Card backgrounds, content areas]
```

---

## 2. SEMANTIC COLOR MAPPING

### Traffic Signal Colors (Intuitive Mapping)

```
🟢 GREEN: Free Flow, Operational, Good
   - Average speed > 50 km/h
   - Operational status: Online
   - Violation status: Paid/Resolved
   - System health: Normal
   Color: #10B981

🟡 YELLOW: Moderate, Caution, Processing
   - Average speed 30-50 km/h
   - Violations: Pending payment
   - Cameras: Maintenance scheduled
   - System health: Degraded
   Color: #F59E0B

🔴 RED: Congested, Alert, Issue
   - Average speed < 30 km/h
   - Violations: Unpaid, Escalated
   - Camera: Offline
   - System health: Critical
   Color: #EF4444

🔵 BLUE: Information, Data, Neutral
   - Speed information
   - Statistics displays
   - Neutral data elements
   Color: #3B82F6
```

### Payment Status Colors

```
✓ Paid:        #10B981 (Green)     - Resolved, closed
⏰ Pending:     #F59E0B (Yellow)    - Awaiting payment (within deadline)
⚠️ Overdue:     #EF4444 (Red)       - Payment deadline passed
📋 Disputed:    #8B5CF6 (Purple)    - Appeal in progress
❌ Rejected:    #DC2626 (Dark Red)  - Appeal denied
```

### Violation Severity Levels

```
🟢 Low:     #10B981  - Parking tickets, minor violations
🟡 Medium:  #F59E0B  - Unsafe lane change, wrong signals
🔴 High:    #EF4444  - Speeding, red light running
🟣 Critical: #7C2D12  - Multiple violations, dangerous behavior
```

---

## 3. HEATMAP COLOR SCALES

### Traffic Intensity Heatmap (Maps & Congestion)

```
Free Flow (0-20%)      #1EA54B 🟢 (Green)
Normal (20-40%)        #6DB24A 🟡 (Yellow-Green)
Moderate (40-60%)      #E8B44C 🟡 (Yellow)
Congested (60-80%)     #F09044 🟠 (Orange)
Heavy Congestion (80%+) #EF4444 🔴 (Red)
```

**Usage:** For traffic heatmaps showing real-time congestion levels

### Violation Density Heatmap (KDE Maps)

```
Cold Spot (Low density)   #1E40AF 🔵 (Dark Blue)
Cool (Low-medium)         #3B82F6 🔵 (Blue)
Warm (Medium)             #F59E0B 🟡 (Yellow)
Hot (Medium-high)         #FB923C 🟠 (Orange)
Hot Spot (High density)   #DC2626 🔴 (Red)
```

**Usage:** For KDE heatmaps showing violation concentration areas

---

## 4. CHART TYPE COLOR SCHEMES

### Bar Charts (Discrete Categories)

```
Single Series:         #3B82F6 (Blue)
Multi-Series (up to 5):
  Series 1:   #3B82F6 (Blue)
  Series 2:   #10B981 (Green)
  Series 3:   #F59E0B (Orange)
  Series 4:   #EF4444 (Red)
  Series 5:   #8B5CF6 (Purple)
```

### Line Charts (Time Series)

```
Primary Line:    #3B82F6 (Blue), 2.5pt width
Secondary Line:  #EF4444 (Red), 2.5pt width, dashed
Tertiary Line:   #10B981 (Green), 2pt width, dotted
Trend Line:      #1E3A8A (Dark Blue), 3pt width, smooth

Confidence Band: #DBEAFE (Light Blue), 20% opacity fill
Standard Dev:    #DBEAFE (Light Blue), 15% opacity fill
```

### Pie/Donut Charts

```
Slice 1: #3B82F6 (Blue)
Slice 2: #10B981 (Green)
Slice 3: #F59E0B (Orange)
Slice 4: #EF4444 (Red)
Slice 5: #8B5CF6 (Purple)
Slice 6+: Lighter shades of above

All: Add 1px dark stroke between slices
```

### Box Plots & Violin Plots

```
Box Fill:       #DBEAFE (Light Blue), 60% opacity
Median Line:    #EF4444 (Red), 2pt width
Whiskers:       #1E3A8A (Dark Blue), 1.5pt width
Outliers:       #DC2626 (Dark Red), 5pt diameter
```

---

## 5. TYPOGRAPHY GUIDE

### Font Stack (Recommended)

**Primary Font:** Inter, Roboto, or Helvetica Neue
**Fallback:** Arial, sans-serif

### Font Sizes & Weights

```
PAGE TITLE
Font: Inter/Roboto Bold
Size: 28pt
Color: #1F2937
Line Height: 1.2
Letter Spacing: -0.5px
Example: "System Impact: Before vs. After Deployment"

SECTION HEADING
Font: Inter/Roboto Bold
Size: 20pt
Color: #1F2937
Line Height: 1.3
Margin Top: 30px
Example: "Figure 4.2: Hourly Violation Distribution"

SUBSECTION HEADING
Font: Inter/Roboto SemiBold
Size: 16pt
Color: #374151
Line Height: 1.3

CHART TITLE
Font: Inter/Roboto SemiBold
Size: 14pt
Color: #1F2937
Margin Bottom: 15px

AXIS LABEL
Font: Inter/Roboto Medium
Size: 11pt
Color: #374151

DATA LABEL (on charts)
Font: Inter/Roboto Medium
Size: 10pt
Color: #1F2937
Background: White with 1px border (if overlapping)

LEGEND TEXT
Font: Inter/Roboto Regular
Size: 10pt
Color: #6B7280

BODY TEXT / CAPTION
Font: Inter/Roboto Regular
Size: 12pt
Color: #374151
Line Height: 1.5
Letter Spacing: 0px

FIGURE CAPTION (Below charts)
Font: Inter/Roboto Regular
Size: 11pt
Color: #6B7280
Font Style: Italic (optional)
Format: "Figure X.Y: Title. Interpretation. Implication."
Margin Top: 10px
```

---

## 6. FIGURE CAPTION TEMPLATE & EXAMPLES

### Standard Caption Format

```
Figure X.Y: [One-line Title Describing Chart]. 
[2-3 sentence interpretation of data and key findings]. 
[Action/implication for reader or how it relates to system impact].
```

### Example Captions

**Example 1: Time-Series Chart**
> Figure 4.2: Hourly Violation Distribution (24-Hour Cycle). Violation frequency exhibits strong bimodal pattern peaking during morning (7-9 AM: 180/hr) and evening (5-7 PM: 160/hr) rush hours. Speeding violations (dashed line) comprise 62% of total during these peaks but drop to 40% during off-peak hours, suggesting commute-induced aggressive driving behavior. Targeted enforcement during peak hours could reduce daily violations by 25-30%.

**Example 2: Bar Chart**
> Figure 4.4: Violation Type Distribution (Last 30 Days). Speeding dominates violation reports (52%, n=3,200), followed by red light violations (29%, n=1,800). Red light violations carry highest average fine (PKR 3,000) due to safety severity. Data-driven enforcement priorities should focus on speeding prevention through targeted signal timing and advisory signage in high-violation zones.

**Example 3: Map**
> Figure 3.1: Camera Network Deployment Map. Strategic placement of 47 ALPR cameras across major intersections ensures comprehensive violation capture. Coverage radius (500m per camera) overlaps minimally, reducing duplicate records while maximizing detection rate. Color coding shows camera type: Red=Plate Recognition, Blue=Speed Detection, Green=Density Monitoring. Three downtown cameras remain offline (gray) pending maintenance scheduled Q3 2026.

**Example 4: Comparison**
> Figure 5.2: System Impact - Before vs. After Deployment. Comprehensive comparison across five impact dimensions demonstrates measurable benefits: (A) Traffic efficiency improved 46% (peak avg speed 28→41 km/h) with 64% reduction in travel time variability. (B) Violations declined 44%, with red light violations down 56%, indicating improved driver compliance. (C) Environmental impact: daily emissions reduced 39% (85→52 tons CO₂). (D) Safety metrics: accidents down 43%. (E) System adoption: 214% app user growth.

---

## 7. COLOR ACCESSIBILITY GUIDELINES

### Contrast Requirements

**WCAG AA Standard (Minimum):** 4.5:1 for normal text, 3:1 for large text
**WCAG AAA Standard (Enhanced):** 7:1 for normal text, 4.5:1 for large text

```
✓ Good Contrast Combinations:
  - Dark Blue (#1E3A8A) on White (#FFFFFF)     Ratio: 9.7:1 ✓
  - Blue (#3B82F6) on White (#FFFFFF)          Ratio: 5.3:1 ✓
  - Dark Gray (#1F2937) on White (#FFFFFF)     Ratio: 13.1:1 ✓
  - Red (#EF4444) on White (#FFFFFF)           Ratio: 3.9:1 ⚠ (Borderline)
  - Orange (#F59E0B) on White (#FFFFFF)        Ratio: 5.2:1 ✓

✗ Poor Contrast Combinations:
  - Light Blue (#DBEAFE) on White (#FFFFFF)    Ratio: 1.1:1 ✗
  - Red (#EF4444) on Light Red (#FEE2E2)       Ratio: 1.9:1 ✗
```

### Colorblind-Safe Palettes

**For Red-Green Colorblind Users (Most Common):**
- Avoid: Red + Green combinations
- Use Instead: Blue + Orange + Yellow

**Recommended Combination:**
```
Primary:       #3B82F6 (Blue)
Secondary:     #F59E0B (Orange)
Tertiary:      #06B6D4 (Cyan)
Quaternary:    #6B21A8 (Purple)
```

**Testing:** Use Coblis simulator at https://www.color-blindness.com/coblis-color-blindness-simulator/

---

## 8. CONSISTENCY CHECKLIST

### Before Finalizing Any Visual

- [ ] **Color Usage:** Consistent with semantic mapping (red=alert, green=good, etc.)
- [ ] **Font Sizes:** All labels ≥10pt for readability
- [ ] **Contrast:** All text ≥4.5:1 contrast ratio
- [ ] **Axes Labels:** Include units (km/h, PKR, minutes, etc.)
- [ ] **Legend:** Present and clearly labeled
- [ ] **Grid Lines:** Light gray, light opacity, not distracting
- [ ] **Data Labels:** Visible numbers on bars/slices
- [ ] **Caption:** Complete and follows standard format
- [ ] **Colorblind Safe:** Validated with Coblis simulator
- [ ] **Export Quality:** 300 DPI PNG or vector PDF/SVG

---

## 9. SAMPLE FIGURE LAYOUTS

### Standard Chart Layout (Recommended)

```
┌─────────────────────────────────────────────────┐
│ Figure Title (16pt Bold, #1F2937)               │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │          [MAIN CHART AREA]                 │ │
│ │          (70% of width)                    │ │
│ │                                             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Y-Axis │  Legend (if large)                    │
│ Label  │  ✓ Series 1 (3,200 total)            │
│        │  ✓ Series 2 (1,800 total)            │
│        │  ✓ Series 3 (680 total)              │
│        │                                        │
│        └─ X-Axis Label ────────────────────→   │
│                                                 │
├─────────────────────────────────────────────────┤
│ Figure 4.2: Violation Type Distribution.        │
│ [Full caption with interpretation & implication]│
│ [2-3 sentences explaining chart findings]       │
└─────────────────────────────────────────────────┘
```

### Dashboard Component Layout

```
┌──────────────────────────────────┐
│ 📊 METRIC CARD                   │
├──────────────────────────────────┤
│                                  │
│ Large Number    523 ↑12%        │
│ (28pt Bold)     (Green)          │
│                                  │
│ Label: "Violations Today"        │
│ (11pt Secondary)                 │
│                                  │
│ [Optional: Mini sparkline/trend] │
│                                  │
└──────────────────────────────────┘
```

---

## 10. EXPORT & FILE NAMING CONVENTIONS

### File Naming Standard

```
{visualization_type}_{data_period}_{version}.{format}

Examples:
✓ violations_hourly_q2_2026_v1.png
✓ traffic_heatmap_may2026_draft.svg
✓ before_after_comparison_final.pdf
✓ camera_network_map_2026_04_24.html
```

### Export Settings by Format

**PNG (Raster - For Static Documents)**
```
Resolution: 300 DPI
Color Mode: RGB
Background: White
Compression: PNG (lossless)
```

**PDF (Vector/Hybrid - For Printing)**
```
Resolution: 300 DPI
Embed Fonts: Yes
Compress: Standard
Color: RGB or CMYK
```

**SVG (Vector - For Web/Scalable)**
```
Format: Vector graphics (XML-based)
Outline Fonts: Yes
Compress: Optional (SVGZ)
```

**Interactive HTML (Plotly/Folium)**
```
Format: Self-contained HTML
File Size: < 5MB recommended
Responsive: Yes (mobile-friendly)
```

---

**Version:** 1.0  
**Last Updated:** April 24, 2026  
**Design System Owner:** Traffic System Visual Analytics Team
