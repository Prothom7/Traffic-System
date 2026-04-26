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