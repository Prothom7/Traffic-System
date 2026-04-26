# Traffic System Visual Assets
## Python Implementation Templates

Complete code examples for generating all visualization types using your actual data.

---

## 1. ENVIRONMENT SETUP

```bash
# Create virtual environment
python -m venv venv_visuals
source venv_visuals/bin/activate  # On Windows: venv_visuals\Scripts\activate

# Install required packages
pip install pandas numpy matplotlib seaborn plotly folium scipy scikit-learn pillow imageio
```

---

## 2. DATA LOADING & PREPARATION

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Example: Load violations from MongoDB export
violations_df = pd.read_csv('violations_export.csv')
# Expected columns: violation_id, timestamp, plate, location, speed_recorded, 
#                   speed_limit, violation_type, fine_amount, vehicle_id

# Convert timestamp to datetime
violations_df['timestamp'] = pd.to_datetime(violations_df['timestamp'])

# Add derived columns
violations_df['hour'] = violations_df['timestamp'].dt.hour
violations_df['zone'] = violations_df['location'].str.split(',').str[0]  # Extract zone
violations_df['overage_percent'] = (
    (violations_df['speed_recorded'] - violations_df['speed_limit']) / 
    violations_df['speed_limit'] * 100
).round(1)

print(f"Loaded {len(violations_df)} violation records")
print(violations_df.head())
```

---

## 3. TIME-SERIES CHART: HOURLY VIOLATIONS

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Aggregate by hour
hourly_violations = violations_df.groupby('hour').agg({
    'violation_id': 'count',
    'speed_recorded': 'mean'
}).rename(columns={'violation_id': 'count', 'speed_recorded': 'avg_speed'})

# Calculate standard deviation for confidence band
hourly_std = violations_df.groupby('hour')['speed_recorded'].std()

# Create figure
fig, ax1 = plt.subplots(figsize=(14, 6))

# Primary axis: violation count (line)
color = '#3B82F6'  # Blue
ax1.set_xlabel('Hour of Day', fontsize=12, fontweight='bold')
ax1.set_ylabel('Violation Count', color=color, fontsize=12, fontweight='bold')
line = ax1.plot(hourly_violations.index, hourly_violations['count'], 
                color=color, marker='o', linewidth=2.5, label='Total Violations', zorder=3)
ax1.fill_between(hourly_violations.index, 
                 hourly_violations['count'] - hourly_std, 
                 hourly_violations['count'] + hourly_std,
                 alpha=0.2, color=color, label='±1 Std Dev')
ax1.tick_params(axis='y', labelcolor=color)
ax1.set_xlim(-0.5, 23.5)
ax1.grid(True, alpha=0.3, linestyle='--')

# Secondary axis: average speed (line)
ax2 = ax1.twinx()
color2 = '#EF4444'  # Red
ax2.set_ylabel('Average Speed (km/h)', color=color2, fontsize=12, fontweight='bold')
ax2.plot(hourly_violations.index, hourly_violations['avg_speed'], 
         color=color2, marker='s', linewidth=2.5, linestyle='--', 
         label='Average Speed', zorder=2)
ax2.tick_params(axis='y', labelcolor=color2)

# Legend
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=10)

# Title and save
plt.title('Hourly Violation Distribution (24-Hour Cycle)', 
          fontsize=14, fontweight='bold', pad=20)
plt.tight_layout()
plt.savefig('violations_hourly.png', dpi=300, bbox_inches='tight')
plt.savefig('violations_hourly.pdf', bbox_inches='tight')
print("✓ Saved: violations_hourly.png")
plt.close()
```

**Output:** Clean time-series chart with dual Y-axes, standard deviation band, professional styling.

---

## 4. BAR CHART: VIOLATION TYPES

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Count by violation type
violation_counts = violations_df['violation_type'].value_counts()
violation_pct = (violation_counts / violation_counts.sum() * 100).round(1)

# Define colors for each type
colors_map = {
    'Speeding': '#EF4444',
    'Red Light': '#F59E0B', 
    'Unsafe Lane': '#FBBF24',
    'Parking': '#3B82F6',
    'Other': '#9CA3AF'
}
colors = [colors_map.get(vtype, '#999999') for vtype in violation_counts.index]

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Plot bars
bars = ax.bar(range(len(violation_counts)), violation_counts.values, color=colors, 
              edgecolor='black', linewidth=0.5, alpha=0.8)

# Add value labels on bars
for i, (count, pct) in enumerate(zip(violation_counts.values, violation_pct.values)):
    ax.text(i, count + 50, f'{count}\n({pct}%)', ha='center', va='bottom', 
            fontsize=11, fontweight='bold')

# Styling
ax.set_xlabel('Violation Type', fontsize=12, fontweight='bold')
ax.set_ylabel('Count', fontsize=12, fontweight='bold')
ax.set_title('Violation Type Distribution (Last 30 Days)', 
             fontsize=14, fontweight='bold', pad=20)
ax.set_xticks(range(len(violation_counts)))
ax.set_xticklabels(violation_counts.index, rotation=0, ha='center')
ax.grid(axis='y', alpha=0.3, linestyle='--')

# Save
plt.tight_layout()
plt.savefig('violations_by_type.png', dpi=300, bbox_inches='tight')
print("✓ Saved: violations_by_type.png")
plt.close()
```

---

## 5. HEATMAP: VIOLATION DENSITY (KDE)

```python
import matplotlib.pyplot as plt
from scipy.stats import gaussian_kde
import numpy as np

# Extract geographic coordinates (latitude, longitude)
# Assuming violation_df has 'latitude' and 'longitude' columns
coords = violations_df[['latitude', 'longitude']].dropna().values

if len(coords) > 0:
    # Create KDE (Kernel Density Estimation)
    kde = gaussian_kde(coords.T)
    
    # Create grid for evaluation
    x_min, x_max = coords[:, 1].min() - 0.01, coords[:, 1].max() + 0.01
    y_min, y_max = coords[:, 0].min() - 0.01, coords[:, 0].max() + 0.01
    xx, yy = np.mgrid[x_min:x_max:100j, y_min:y_max:100j]
    positions = np.vstack([xx.ravel(), yy.ravel()])
    z = kde(positions).reshape(xx.shape)
    
    # Create figure
    fig, ax = plt.subplots(figsize=(12, 10))
    
    # Plot KDE heatmap
    im = ax.contourf(xx, yy, z, levels=15, cmap='RdYlGn_r', alpha=0.8)
    cbar = plt.colorbar(im, ax=ax, label='Violation Density (kernel estimate)')
    
    # Overlay actual violation points
    scatter = ax.scatter(coords[:, 1], coords[:, 0], alpha=0.3, s=10, 
                        c='red', edgecolors='darkred', linewidth=0.5)
    
    # Styling
    ax.set_xlabel('Longitude', fontsize=11, fontweight='bold')
    ax.set_ylabel('Latitude', fontsize=11, fontweight='bold')
    ax.set_title('Violation Hotspot Map (Kernel Density Estimation)', 
                 fontsize=14, fontweight='bold', pad=20)
    
    # Save
    plt.tight_layout()
    plt.savefig('violation_hotspot_kde.png', dpi=300, bbox_inches='tight')
    print("✓ Saved: violation_hotspot_kde.png")
    plt.close()
```

---

## 6. BOX PLOT: TRAVEL TIME RELIABILITY

```python
import matplotlib.pyplot as plt
import pandas as pd

# Example data: travel times by road segment
# Create sample data structure
travel_times = pd.DataFrame({
    'road_segment': ['M-1', 'M-2', 'M-3', 'M-4', 'M-5'] * 50,
    'travel_time': np.random.normal([25, 30, 32, 28, 35], 5, 250)
})

# Create figure
fig, ax = plt.subplots(figsize=(14, 6))

# Prepare data for box plot
road_segments = travel_times['road_segment'].unique()
data_by_road = [travel_times[travel_times['road_segment'] == rs]['travel_time'].values 
                for rs in road_segments]

# Create box plot
bp = ax.boxplot(data_by_road, labels=road_segments, patch_artist=True,
                 medianprops=dict(color='red', linewidth=2),
                 boxprops=dict(facecolor='#DBEAFE', color='#1E3A8A', linewidth=1.5),
                 whiskerprops=dict(color='#1E3A8A', linewidth=1.5),
                 capprops=dict(color='#1E3A8A', linewidth=1.5))

# Styling
ax.set_ylabel('Travel Time (minutes)', fontsize=12, fontweight='bold')
ax.set_xlabel('Road Segment', fontsize=12, fontweight='bold')
ax.set_title('Travel Time Distribution by Road Segment', 
             fontsize=14, fontweight='bold', pad=20)
ax.grid(axis='y', alpha=0.3, linestyle='--')

# Save
plt.tight_layout()
plt.savefig('travel_time_boxplot.png', dpi=300, bbox_inches='tight')
print("✓ Saved: travel_time_boxplot.png")
plt.close()
```

---

## 7. INTERACTIVE MAP WITH FOLIUM

```python
import folium
import pandas as pd

# Create map centered on city
city_center = [34.0522, 74.3585]  # Downtown Chowk coordinates
map_obj = folium.Map(location=city_center, zoom_start=11, 
                     tiles='OpenStreetMap')

# Add camera locations (from database)
cameras_df = pd.read_csv('cameras_locations.csv')
# Expected: camera_id, location_name, latitude, longitude, status

for idx, row in cameras_df.iterrows():
    # Color based on status
    color = 'green' if row['status'] == 'operational' else 'red'
    
    # Create popup with info
    popup_text = f"""
    <b>{row['location_name']}</b><br>
    Camera ID: {row['camera_id']}<br>
    Status: {row['status']}<br>
    Violations Today: {np.random.randint(10, 50)}
    """
    
    folium.CircleMarker(
        location=[row['latitude'], row['longitude']],
        radius=8,
        popup=folium.Popup(popup_text, max_width=250),
        color=color,
        fill=True,
        fillColor=color,
        fillOpacity=0.7,
        weight=2
    ).add_to(map_obj)

# Add coverage circles (500m radius)
for idx, row in cameras_df.iterrows():
    folium.Circle(
        location=[row['latitude'], row['longitude']],
        radius=500,  # meters
        color='blue',
        fill=False,
        weight=1,
        opacity=0.3,
        dashArray='5, 5'
    ).add_to(map_obj)

# Save map
map_obj.save('camera_network_map.html')
print("✓ Saved: camera_network_map.html")

# Convert to PNG (requires wkhtmltoimage)
# import os
# os.system('wkhtmltoimage camera_network_map.html camera_network_map.png')
```

---

## 8. BEFORE/AFTER COMPARISON INFOGRAPHIC

```python
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch

# Define metrics
metrics = {
    'Avg Speed (km/h)': {'before': 28, 'after': 41, 'improvement': '+46%'},
    'Violations/Day': {'before': 330, 'after': 185, 'improvement': '-44%'},
    'Avg Travel Time': {'before': 45, 'after': 32, 'improvement': '-29%'},
    'Emissions (tons)': {'before': 85, 'after': 52, 'improvement': '-39%'},
    'Accidents/Month': {'before': 28, 'after': 16, 'improvement': '-43%'},
}

# Create figure with subplots (one per metric)
fig, axes = plt.subplots(2, 3, figsize=(16, 8))
axes = axes.flatten()

colors_before = '#EF4444'  # Red
colors_after = '#10B981'   # Green

for idx, (metric, values) in enumerate(metrics.items()):
    ax = axes[idx]
    
    # Create bars
    x_pos = [0, 1]
    bars = ax.bar(x_pos, [values['before'], values['after']], 
                  color=[colors_before, colors_after], alpha=0.8, 
                  edgecolor='black', linewidth=1.5, width=0.5)
    
    # Add value labels
    ax.text(0, values['before'] + 2, str(values['before']), 
            ha='center', va='bottom', fontsize=14, fontweight='bold')
    ax.text(1, values['after'] + 2, str(values['after']), 
            ha='center', va='bottom', fontsize=14, fontweight='bold')
    
    # Add improvement label
    ax.text(0.5, max(values['before'], values['after']) * 0.5, 
            values['improvement'], ha='center', va='center', 
            fontsize=16, fontweight='bold', color='white',
            bbox=dict(boxstyle='round', facecolor='#1F2937', alpha=0.9))
    
    # Styling
    ax.set_xticks(x_pos)
    ax.set_xticklabels(['Before', 'After'], fontsize=11, fontweight='bold')
    ax.set_ylabel(metric, fontsize=11, fontweight='bold')
    ax.set_ylim(0, max(values['before'], values['after']) * 1.15)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

# Hide extra subplot
axes[-1].axis('off')

# Add main title
fig.suptitle('System Impact: Before vs. After Deployment (6-Week Pilot)', 
             fontsize=16, fontweight='bold', y=0.98)

plt.tight_layout()
plt.savefig('before_after_comparison.png', dpi=300, bbox_inches='tight')
print("✓ Saved: before_after_comparison.png")
plt.close()
```

---

## 9. SCATTER PLOT: TRIP DURATION vs TIME OF DAY

```python
import matplotlib.pyplot as plt
import pandas as pd

# Example: trip data with duration and hour
trips_df = pd.DataFrame({
    'hour': np.random.randint(0, 24, 1000),
    'trip_duration': np.random.normal(35, 15, 1000),
    'congestion_level': np.random.choice(['Low', 'Moderate', 'High'], 1000)
})

# Color map for congestion
color_map = {'Low': '#10B981', 'Moderate': '#F59E0B', 'High': '#EF4444'}
colors = [color_map[level] for level in trips_df['congestion_level']]

# Create figure
fig, ax = plt.subplots(figsize=(14, 7))

# Scatter plot
scatter = ax.scatter(trips_df['hour'], trips_df['trip_duration'], 
                    c=colors, alpha=0.5, s=50, edgecolors='black', linewidth=0.3)

# Add trend line
z = np.polyfit(trips_df['hour'], trips_df['trip_duration'], 2)
p = np.poly1d(z)
x_smooth = np.linspace(0, 23, 100)
ax.plot(x_smooth, p(x_smooth), color='#1E3A8A', linewidth=3, label='Trend', zorder=5)

# Styling
ax.set_xlabel('Hour of Day', fontsize=12, fontweight='bold')
ax.set_ylabel('Trip Duration (minutes)', fontsize=12, fontweight='bold')
ax.set_title('Trip Duration vs. Time of Day (Congestion Impact)', 
             fontsize=14, fontweight='bold', pad=20)
ax.set_xlim(-1, 24)
ax.set_xticks(range(0, 24, 2))
ax.grid(True, alpha=0.3, linestyle='--')

# Add legend
from matplotlib.patches import Patch
legend_elements = [Patch(facecolor='#10B981', label='Low Congestion'),
                   Patch(facecolor='#F59E0B', label='Moderate'),
                   Patch(facecolor='#EF4444', label='High Congestion')]
ax.legend(handles=legend_elements, loc='upper right', fontsize=10)

# Save
plt.tight_layout()
plt.savefig('trip_duration_scatter.png', dpi=300, bbox_inches='tight')
print("✓ Saved: trip_duration_scatter.png")
plt.close()
```

---

## 10. ANIMATED SEQUENCE: VIOLATION DETECTION

```python
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import imageio
import os

# Create 4-frame animation
frames = []

# Define animation frames
frame_data = [
    {
        'title': 'Step 1: Camera Detects Vehicle (T+0ms)',
        'subtitle': 'High-speed image acquisition',
        'image_desc': '[Vehicle image]',
        'bg_color': '#DBEAFE'
    },
    {
        'title': 'Step 2: ALPR Recognition (T+500ms)',
        'subtitle': 'License plate extracted with 97% confidence',
        'image_desc': '[Plate: ABC-1234]',
        'bg_color': '#FEF3C7'
    },
    {
        'title': 'Step 3: Database Match (T+1000ms)',
        'subtitle': 'Vehicle identified: Ali Ahmed, 2020 Toyota Corolla',
        'image_desc': '[Vehicle profile]',
        'bg_color': '#D1FAE5'
    },
    {
        'title': 'Step 4: Notification Sent (T+3000ms)',
        'subtitle': 'SMS + Email + App notification delivered',
        'image_desc': '[Notification icons]',
        'bg_color': '#E0E7FF'
    }
]

for idx, frame_info in enumerate(frame_data):
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Background
    ax.add_patch(patches.Rectangle((0, 0), 1, 1, transform=ax.transAxes,
                                   facecolor=frame_info['bg_color']))
    
    # Title
    ax.text(0.5, 0.85, frame_info['title'], transform=ax.transAxes,
            fontsize=16, fontweight='bold', ha='center', va='top')
    
    # Subtitle
    ax.text(0.5, 0.75, frame_info['subtitle'], transform=ax.transAxes,
            fontsize=12, ha='center', va='top', style='italic', color='#4B5563')
    
    # Content area
    ax.text(0.5, 0.5, frame_info['image_desc'], transform=ax.transAxes,
            fontsize=14, ha='center', va='center',
            bbox=dict(boxstyle='round', facecolor='white', edgecolor='#1E3A8A', linewidth=2))
    
    # Progress indicator
    progress_width = (idx + 1) / len(frame_data)
    ax.add_patch(patches.Rectangle((0, 0.02), progress_width, 0.05, 
                                   transform=ax.transAxes,
                                   facecolor='#3B82F6'))
    ax.text(1.0, 0.02, f'{idx + 1}/{len(frame_data)}', transform=ax.transAxes,
            fontsize=10, ha='right', va='bottom')
    
    # Remove axes
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    
    # Save frame
    frame_path = f'frame_{idx}.png'
    plt.savefig(frame_path, dpi=100, bbox_inches='tight', facecolor='white')
    frames.append(imageio.imread(frame_path))
    plt.close()

# Create animated GIF
imageio.mimsave('violation_detection_animation.gif', frames, duration=1, loop=0)
print("✓ Saved: violation_detection_animation.gif")

# Clean up frame files
for i in range(len(frame_data)):
    os.remove(f'frame_{i}.png')
```

---

## USAGE INSTRUCTIONS

1. Prepare CSV exports from your MongoDB database with violation and traffic data
2. Adjust column names to match your actual data structure
3. Run each visualization script individually:
   ```bash
   python visualization_script.py
   ```
4. Generated files will be saved to current directory
5. All outputs use professional color schemes and 300 DPI for publication quality

**Required Columns for Each Visualization:**

| Visualization | Required Columns |
|---|---|
| Hourly violations | timestamp, speed_recorded, speed_limit |
| Violation types | violation_type |
| Hotspot map | latitude, longitude |
| Box plots | road_segment, travel_time |
| Camera network | camera_id, latitude, longitude, status |

---

**Version:** 1.0  
**Last Updated:** April 24, 2026
