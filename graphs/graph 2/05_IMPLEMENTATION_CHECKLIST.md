# Traffic System Visual Assets
## Implementation Checklist & Getting Started Guide

Step-by-step checklist to create all visualizations from scratch.

---

## QUICK START (WEEK 1: 4 Hours)

Priority: Create these high-impact visuals immediately

### ✓ Visual 1: System Architecture Diagram (1 hour)
- [ ] Open Mermaid Live Editor (https://mermaid.live)
- [ ] Copy architecture diagram code from `03_MERMAID_DIAGRAM_TEMPLATES.md`
- [ ] Customize component names if needed
- [ ] Export as PNG (1920×1080 resolution)
- [ ] Save as: `system_architecture_v1.png`
- [ ] Caption: See `04_DESIGN_SYSTEM_COLOR_PALETTE.md` Section 6

### ✓ Visual 2: Before/After Metrics Infographic (1 hour)
- [ ] Gather data from database:
  - [ ] Avg speed (before: 28 km/h, after: 41 km/h)
  - [ ] Violation count (before: 330/day, after: 185/day)
  - [ ] Travel time (before: 45 min, after: 32 min)
  - [ ] Emissions (before: 85 tons, after: 52 tons)
  - [ ] Accidents (before: 28/month, after: 16/month)
- [ ] Use Python script from `02_PYTHON_IMPLEMENTATION_CODE.md` Section 8
- [ ] Or manually create in Figma/PowerPoint
- [ ] Export as PNG: `before_after_comparison_v1.png`

### ✓ Visual 3: Violation Type Bar Chart (1 hour)
- [ ] Export violations data from MongoDB:
  ```
  db.trafficrecords.aggregate([
    { $group: { _id: "$violation_type", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  ```
- [ ] Save as CSV: `violations_by_type.csv`
- [ ] Run Python script: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 4
- [ ] Export as PNG: `violations_by_type_v1.png`

### ✓ Visual 4: Hourly Violation Timeline (1 hour)
- [ ] Export violations aggregated by hour:
  ```
  db.trafficrecords.aggregate([
    { $group: { 
        _id: { $hour: "$timestamp" }, 
        count: { $sum: 1 },
        avg_speed: { $avg: "$speed_recorded" }
      }}
  ])
  ```
- [ ] Save as CSV: `violations_hourly.csv`
- [ ] Run Python script: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 3
- [ ] Export as PNG: `violations_hourly_v1.png`

**WEEK 1 DELIVERABLES:** 4 PNG files (~2-3 MB total)

---

## PHASE 1: DATA PREPARATION (Day 1-2)

### Step 1: Export Data from MongoDB

**Command-line (mongosh):**
```bash
# Connect to MongoDB
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/traffic_db"

# Export violations
db.trafficrecords.find().limit(10000).pretty() > violations_export.json

# Export traffic zones
db.locations.find().pretty() > locations_export.json

# Export cameras
db.signals.find().pretty() > cameras_export.json
```

**Using MongoDB Compass (GUI):**
1. Connect to your cluster
2. Select database: `traffic_db`
3. For each collection:
   - Right-click → Export Collection
   - Format: CSV or JSON
   - Save to `/data` folder

**Exported Files Needed:**
- [ ] `violations_raw.csv` (columns: timestamp, plate, location, speed_recorded, speed_limit, violation_type, fine_amount)
- [ ] `traffic_zones.csv` (columns: zone_id, latitude, longitude, avg_speed, vehicle_count)
- [ ] `cameras_locations.csv` (columns: camera_id, location_name, latitude, longitude, status)
- [ ] `travel_times.csv` (columns: road_segment, travel_time, hour, congestion_level)

### Step 2: Data Cleaning & Validation

**Python Script:**
```python
import pandas as pd
import numpy as np

# Load and validate violations
violations = pd.read_csv('violations_raw.csv')

# Check for issues
print(f"Total records: {len(violations)}")
print(f"Null values:\n{violations.isnull().sum()}")
print(f"Date range: {violations['timestamp'].min()} to {violations['timestamp'].max()}")

# Remove nulls in critical columns
violations = violations.dropna(subset=['timestamp', 'plate', 'speed_recorded'])

# Validate speed values (must be positive)
violations = violations[violations['speed_recorded'] > 0]

# Export cleaned
violations.to_csv('violations_cleaned.csv', index=False)
print("✓ Cleaned data saved: violations_cleaned.csv")
```

### Step 3: Compute Aggregations

**Python Script:**
```python
import pandas as pd

violations = pd.read_csv('violations_cleaned.csv')
violations['timestamp'] = pd.to_datetime(violations['timestamp'])

# Hourly aggregation
hourly = violations.groupby(violations['timestamp'].dt.hour).agg({
    'violation_id': 'count',
    'speed_recorded': 'mean',
    'fine_amount': 'sum'
}).rename(columns={'violation_id': 'count'})
hourly.to_csv('violations_hourly.csv')

# By type
by_type = violations.groupby('violation_type').size().sort_values(ascending=False)
by_type.to_csv('violations_by_type.csv')

# By zone
by_zone = violations.groupby('zone_id').agg({
    'violation_id': 'count',
    'speed_recorded': 'mean'
})
by_zone.to_csv('violations_by_zone.csv')

print("✓ Aggregations complete")
```

---

## PHASE 2: CORE VISUALIZATIONS (Days 3-5)

### Visualization Workflow for Each Chart

```
1. DATA READY?
   └─ violations_cleaned.csv exists with all columns
   
2. CHOOSE TOOL
   ├─ Seaborn/Matplotlib: Python, local control
   ├─ Plotly: Interactive web charts
   └─ Figma/Canva: Manual design
   
3. CREATE VISUAL
   └─ Run appropriate Python script from Section 02
   
4. VALIDATE
   ├─ Axes labeled with units ✓
   ├─ Legend present and clear ✓
   ├─ Colors follow palette ✓
   ├─ Title formatted correctly ✓
   └─ Resolution 300 DPI ✓
   
5. EXPORT
   ├─ PNG for reports
   └─ PDF for printing
```

### Checklist: Core Visualizations (Priority Order)

#### Priority 1 - ESSENTIAL (Complete by Day 3)

- [ ] **System Architecture Diagram** (1h)
  - Tool: Mermaid
  - Code: `03_MERMAID_DIAGRAM_TEMPLATES.md` Section 1
  - Output: `system_architecture.png`

- [ ] **Before/After Comparison** (1h)
  - Tool: Python/Figma
  - Code: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 8
  - Output: `before_after_comparison.png`

- [ ] **Violation Type Bar Chart** (1h)
  - Tool: Python Seaborn
  - Code: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 4
  - Data: `violations_by_type.csv`
  - Output: `violations_by_type.png`

- [ ] **Hourly Violation Timeline** (1.5h)
  - Tool: Python Plotly/Matplotlib
  - Code: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 3
  - Data: `violations_hourly.csv`
  - Output: `violations_hourly.png`

#### Priority 2 - HIGH (Complete by Day 4)

- [ ] **Violation Hotspot Map (KDE)** (2h)
  - Tool: Python scipy/folium
  - Code: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 5
  - Data: `violations_cleaned.csv` (with lat/lng)
  - Output: `violation_hotspot_kde.png`

- [ ] **Camera Network Map** (2h)
  - Tool: Folium/Leaflet
  - Code: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 7
  - Data: `cameras_locations.csv`
  - Output: `camera_network_map.html` + `.png`

- [ ] **Dashboard Mockup** (2h)
  - Tool: Figma / Adobe XD
  - Reference: `01_VISUAL_ASSETS_MASTER_GUIDE.md` Section 4.1
  - Output: `dashboard_mockup.png`

- [ ] **ALPR Process Diagram** (1.5h)
  - Tool: Mermaid / Draw.io
  - Code: `03_MERMAID_DIAGRAM_TEMPLATES.md` Section 4
  - Output: `alpr_process_diagram.png`

#### Priority 3 - RECOMMENDED (Complete by Day 5)

- [ ] **Data Flow Diagram Level 1** (1.5h)
  - Tool: Mermaid
  - Code: `03_MERMAID_DIAGRAM_TEMPLATES.md` Section 3
  - Output: `dfd_level_1.png`

- [ ] **Box Plot - Travel Time** (1.5h)
  - Tool: Python Seaborn
  - Code: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 6
  - Data: `travel_times.csv`
  - Output: `travel_time_boxplot.png`

- [ ] **Speed Profile by Road** (1h)
  - Tool: Python Matplotlib
  - Code: Adapt from Section 3 in `02_PYTHON_IMPLEMENTATION_CODE.md`
  - Data: `road_segments_speed.csv`
  - Output: `speed_profile_by_road.png`

---

## PHASE 3: ADVANCED VISUALIZATIONS (Days 6-7)

### Advanced Visuals (Optional but Impressive)

- [ ] **Sequence Diagram - Violation Lifecycle** (1h)
  - Tool: Mermaid
  - Code: `03_MERMAID_DIAGRAM_TEMPLATES.md` Section 4
  - Output: `sequence_violation.png`

- [ ] **Adaptive Signal Control Concept** (2.5h)
  - Tool: Figma / Illustrator
  - Reference: `01_VISUAL_ASSETS_MASTER_GUIDE.md` Section 6.1
  - Output: `signal_control_concept.png`

- [ ] **End-to-End Lifecycle Infographic** (3h)
  - Tool: Figma / Illustrator
  - Reference: `01_VISUAL_ASSETS_MASTER_GUIDE.md` Section 6.3
  - Output: `lifecycle_infographic.png`

- [ ] **Animated Violation Detection GIF** (3h)
  - Tool: Python PIL/imageio
  - Code: `02_PYTHON_IMPLEMENTATION_CODE.md` Section 10
  - Output: `violation_detection_animation.gif` (4 frames)

---

## IMPLEMENTATION SCHEDULE

### Week 1 (4 hours - MINIMUM)
| Day | Task | Hours | Output |
|-----|------|-------|--------|
| Mon | Architecture diagram | 1 | `.png` |
| Mon | Before/after comparison | 1 | `.png` |
| Tue | Bar chart (violation types) | 1 | `.png` |
| Tue | Hourly timeline | 1 | `.png` |
| **Total** | **Quick start visuals** | **4** | **4 PNG files** |

### Week 2 (12 hours - COMPREHENSIVE)
| Day | Task | Hours | Output |
|-----|------|-------|--------|
| Wed | Data export & cleaning | 2 | `*_cleaned.csv` |
| Wed | Hotspot map (KDE) | 2 | `.png` + `.html` |
| Thu | Camera network map | 2 | `.html` + `.png` |
| Thu | Dashboard mockup | 2 | `.png` |
| Fri | ALPR process diagram | 1.5 | `.png` |
| Fri | DFD Level 1 | 1.5 | `.png` |
| **Subtotal Week 2** | | **12** | **8+ files** |

### Week 3+ (12+ hours - POLISHED PRESENTATION)
| Day | Task | Hours | Output |
|-----|------|-------|--------|
| Mon | Travel time box plot | 1.5 | `.png` |
| Mon | Speed profile | 1 | `.png` |
| Tue | Sequence diagram | 1 | `.png` |
| Tue | Signal control concept | 2.5 | `.png` |
| Wed | Lifecycle infographic | 3 | `.png` |
| Wed | Animation (GIF) | 3 | `.gif` |
| Thu | Review & refinement | 1 | Updated files |
| **Subtotal Week 3+** | | **12+** | **Polished assets** |

---

## TOOLS SETUP & INSTALLATION

### Required Tools

```bash
# Install Python packages
pip install pandas numpy matplotlib seaborn plotly folium scipy scikit-learn pillow imageio

# Verify installations
python -c "import pandas; import seaborn; import plotly; print('✓ All packages ready')"
```

### Optional Tools

- **Figma** (Free): https://www.figma.com
- **Mermaid Live Editor:** https://mermaid.live
- **Draw.io**: https://draw.io
- **VS Code Extension:** "Markdown Preview Mermaid Support"

---

## VALIDATION CHECKLIST (Before Submitting Visuals)

### For Every Visual

- [ ] **Data Accuracy**
  - [ ] Values match source database export
  - [ ] Date ranges are correct
  - [ ] No outliers or errors in calculations

- [ ] **Visual Design**
  - [ ] Title is clear and descriptive
  - [ ] Font size ≥10pt for all labels
  - [ ] Colors follow palette from `04_DESIGN_SYSTEM_COLOR_PALETTE.md`
  - [ ] All axes labeled with units (km/h, PKR, etc.)
  - [ ] Legend present (if applicable)

- [ ] **Accessibility**
  - [ ] Text contrast ≥4.5:1 (check with WebAIM Contrast Checker)
  - [ ] Colorblind-safe (test with Coblis simulator)
  - [ ] No critical information conveyed by color alone

- [ ] **Formatting**
  - [ ] Caption follows standard format (Figure X.Y: Title. Interpretation. Implication.)
  - [ ] Resolution 300 DPI (for PNG/PDF)
  - [ ] File naming follows convention: `{type}_{period}_{version}.{ext}`
  - [ ] No watermarks or personal markings

### Before Final Submission

- [ ] All 4+ core visuals created ✓
- [ ] Color palette applied consistently ✓
- [ ] Captions written for each figure ✓
- [ ] Peer-reviewed by colleague ✓
- [ ] Files organized in `/graphs/graph 2/` folder ✓

---

## FILE ORGANIZATION

Recommended folder structure for visual assets:

```
graphs/
└── graph 2/
    ├── 01_VISUAL_ASSETS_MASTER_GUIDE.md ................... (This file)
    ├── 02_PYTHON_IMPLEMENTATION_CODE.md
    ├── 03_MERMAID_DIAGRAM_TEMPLATES.md
    ├── 04_DESIGN_SYSTEM_COLOR_PALETTE.md
    ├── 05_IMPLEMENTATION_CHECKLIST.md
    │
    ├── source_data/
    │   ├── violations_cleaned.csv
    │   ├── violations_hourly.csv
    │   ├── violations_by_type.csv
    │   └── cameras_locations.csv
    │
    ├── outputs/
    │   ├── system_architecture.png (300 DPI)
    │   ├── before_after_comparison.png
    │   ├── violations_by_type.png
    │   ├── violations_hourly.png
    │   ├── violation_hotspot_kde.png
    │   ├── camera_network_map.html
    │   ├── dashboard_mockup.png
    │   ├── alpr_process_diagram.png
    │   └── ... (more outputs)
    │
    └── metadata/
        ├── visualization_index.md
        ├── captions_final.md
        └── color_palette_codes.txt
```

---

## TROUBLESHOOTING COMMON ISSUES

### Python Script Errors

**Error:** `ModuleNotFoundError: No module named 'pandas'`
```bash
Solution: pip install pandas numpy seaborn matplotlib
```

**Error:** `UnicodeDecodeError` when reading CSV
```python
Solution: violations_df = pd.read_csv('file.csv', encoding='utf-8-sig')
```

### Visualization Issues

**Problem:** Chart axis labels are cut off
```python
Solution: plt.tight_layout() before plt.savefig()
```

**Problem:** Colors look different from palette
```python
Check: 1) Export DPI (use 300)
      2) Colorspace (RGB vs CMYK)
      3) Monitor calibration
```

**Problem:** File too large (PNG > 5 MB)
```bash
Solution 1: Reduce DPI (250 instead of 300)
Solution 2: Use PDF or SVG for vector graphics
Solution 3: Compress PNG: pngquant file.png --quality=80-90
```

### Mermaid Rendering

**Problem:** Mermaid diagram not rendering in VS Code
```
Solution: Install "Markdown Preview Mermaid Support" extension
```

**Problem:** Diagram too large when exported
```
Solution: Use Mermaid CLI with custom scale:
         mmdc -i diagram.mmd -o diagram.png -s 2
```

---

## QUICK REFERENCE: SCRIPT COMMANDS

Copy-paste commands for quick execution:

```bash
# Generate time-series chart
python -c "
import pandas as pd
import matplotlib.pyplot as plt
violations = pd.read_csv('violations_hourly.csv')
plt.figure(figsize=(14,6))
plt.plot(violations.index, violations['count'], marker='o', color='#3B82F6')
plt.savefig('violations_hourly.png', dpi=300)
print('✓ Chart saved')
"

# Export data from local JSON
python -c "
import pandas as pd
data = pd.read_json('violations_export.json')
data.to_csv('violations_cleaned.csv', index=False)
print(f'✓ Converted {len(data)} records')
"
```

---

## SUPPORT & RESOURCES

| Resource | Link | Use Case |
|----------|------|----------|
| Mermaid Docs | https://mermaid.js.org | Diagram syntax |
| Matplotlib Gallery | https://matplotlib.org/gallery | Chart examples |
| Plotly Docs | https://plotly.com/python | Interactive charts |
| Seaborn Docs | https://seaborn.pydata.org | Statistical viz |
| Figma Tutorials | https://www.youtube.com/c/Figma | Design tools |
| MongoDB Query | https://docs.mongodb.com | Data extraction |
| WCAG Colors | https://webaim.org/resources/contrastchecker | Accessibility |

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 24, 2026 | Initial comprehensive guide |
| 1.1 | (Future) | Add interactive dashboard scripts |

---

**Next Steps:** Start with Week 1 Quick Start, then progress through Phases 2-3 based on timeline.

**Questions?** Refer to section numbers in the main guide for detailed explanations.
