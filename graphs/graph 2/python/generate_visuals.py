from __future__ import annotations

from pathlib import Path

import imageio.v2 as imageio
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import pandas as pd
import seaborn as sns
from scipy.stats import gaussian_kde
import folium

BASE_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = BASE_DIR / "illustrations"
OUT_DIR.mkdir(parents=True, exist_ok=True)

sns.set_theme(style="whitegrid", font="DejaVu Sans")


def save_fig(name: str) -> None:
    plt.tight_layout()
    plt.savefig(OUT_DIR / name, dpi=300, bbox_inches="tight")
    plt.close()


def build_sample_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    rng = np.random.default_rng(42)

    hours = np.arange(24)
    counts = (85 + 45 * np.sin((hours - 7) / 24 * 2 * np.pi) + 30 * np.sin((hours - 17) / 24 * 2 * np.pi)).round().astype(int)
    avg_speed = (58 - 12 * np.sin((hours - 8) / 24 * 2 * np.pi) - 10 * np.sin((hours - 18) / 24 * 2 * np.pi)).round(1)
    hourly = pd.DataFrame({"hour": hours, "violations": counts, "avg_speed": avg_speed})

    violation_types = pd.DataFrame(
        {
            "type": ["Speeding", "Red Light", "Unsafe Lane", "Parking", "Other"],
            "count": [3200, 1800, 680, 320, 100],
        }
    )

    n = 1200
    lat = 34.05 + rng.normal(0, 0.035, n)
    lng = 74.35 + rng.normal(0, 0.04, n)
    density = pd.DataFrame({"lat": lat, "lng": lng})

    return hourly, violation_types, density


def plot_hourly(hourly: pd.DataFrame) -> None:
    fig, ax1 = plt.subplots(figsize=(14, 6))
    ax1.plot(hourly["hour"], hourly["violations"], color="#3B82F6", marker="o", linewidth=2.5, label="Violations")
    ax1.set_xlabel("Hour of Day")
    ax1.set_ylabel("Violations", color="#3B82F6")
    ax1.tick_params(axis="y", labelcolor="#3B82F6")
    ax1.set_xlim(-0.5, 23.5)
    ax1.grid(True, alpha=0.25, linestyle="--")

    ax2 = ax1.twinx()
    ax2.plot(hourly["hour"], hourly["avg_speed"], color="#EF4444", marker="s", linestyle="--", linewidth=2.2, label="Avg Speed")
    ax2.set_ylabel("Average Speed (km/h)", color="#EF4444")
    ax2.tick_params(axis="y", labelcolor="#EF4444")

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper right")
    plt.title("Hourly Violation Distribution")
    save_fig("violations_hourly.png")



def plot_violation_types(violation_types: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(12, 6))
    palette = ["#EF4444", "#F59E0B", "#FBBF24", "#3B82F6", "#9CA3AF"]
    bars = ax.bar(violation_types["type"], violation_types["count"], color=palette, edgecolor="black", linewidth=0.5)
    for bar, count in zip(bars, violation_types["count"]):
        ax.text(bar.get_x() + bar.get_width() / 2, count + 40, f"{count}", ha="center", va="bottom", fontweight="bold")
    ax.set_title("Violation Type Distribution")
    ax.set_xlabel("Violation Type")
    ax.set_ylabel("Count")
    save_fig("violations_by_type.png")



def plot_before_after() -> None:
    labels = ["Speed", "Violations", "Travel Time", "Emissions", "Accidents"]
    before = np.array([28, 330, 45, 85, 28])
    after = np.array([41, 185, 32, 52, 16])

    x = np.arange(len(labels))
    width = 0.35
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.bar(x - width / 2, before, width, label="Before", color="#EF4444")
    ax.bar(x + width / 2, after, width, label="After", color="#10B981")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_title("Before vs After System Deployment")
    ax.legend()
    save_fig("before_after_comparison.png")



def plot_hotspot_map(density: pd.DataFrame) -> None:
    coords = density[["lat", "lng"]].to_numpy()
    kde = gaussian_kde(coords.T)
    x_min, x_max = coords[:, 1].min() - 0.03, coords[:, 1].max() + 0.03
    y_min, y_max = coords[:, 0].min() - 0.03, coords[:, 0].max() + 0.03
    xx, yy = np.mgrid[x_min:x_max:100j, y_min:y_max:100j]
    z = kde(np.vstack([xx.ravel(), yy.ravel()])).reshape(xx.shape)

    fig, ax = plt.subplots(figsize=(10, 8))
    ax.contourf(xx, yy, z, levels=15, cmap="RdYlGn_r", alpha=0.85)
    ax.scatter(coords[:, 1], coords[:, 0], s=8, c="black", alpha=0.15)
    ax.set_title("Violation Hotspot KDE Map")
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    save_fig("violation_hotspot_kde.png")



def plot_travel_time_boxplot() -> None:
    rng = np.random.default_rng(7)
    data = [
        rng.normal(24, 4, 60),
        rng.normal(30, 5, 60),
        rng.normal(33, 6, 60),
        rng.normal(28, 4, 60),
        rng.normal(36, 6, 60),
    ]
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.boxplot(data, labels=["M-1", "M-2", "M-3", "M-4", "M-5"], patch_artist=True)
    ax.set_title("Travel Time Distribution by Road Segment")
    ax.set_ylabel("Travel Time (minutes)")
    save_fig("travel_time_boxplot.png")



def plot_scatter() -> None:
    rng = np.random.default_rng(12)
    hour = rng.integers(0, 24, 700)
    trip_duration = np.clip(rng.normal(35 + 10 * np.sin((hour - 8) / 24 * 2 * np.pi), 8), 10, 120)
    congestion = np.where(trip_duration < 30, "Low", np.where(trip_duration < 55, "Moderate", "High"))
    colors = {"Low": "#10B981", "Moderate": "#F59E0B", "High": "#EF4444"}

    fig, ax = plt.subplots(figsize=(14, 7))
    for level in ["Low", "Moderate", "High"]:
        mask = congestion == level
        ax.scatter(hour[mask], trip_duration[mask], s=22, alpha=0.45, label=level, c=colors[level], edgecolors="none")
    ax.set_title("Trip Duration vs Time of Day")
    ax.set_xlabel("Hour of Day")
    ax.set_ylabel("Trip Duration (minutes)")
    ax.legend(title="Congestion")
    save_fig("trip_duration_scatter.png")



def plot_camera_map() -> None:
    cams = pd.DataFrame(
        {
            "name": ["CAM-01", "CAM-02", "CAM-03", "CAM-04"],
            "lat": [34.055, 34.041, 34.066, 34.032],
            "lng": [74.351, 74.369, 74.336, 74.362],
            "status": ["operational", "operational", "offline", "operational"],
        }
    )
    city_center = [34.0522, 74.3585]
    m = folium.Map(location=city_center, zoom_start=12)
    for _, row in cams.iterrows():
        color = "green" if row["status"] == "operational" else "red"
        folium.CircleMarker(
            [row["lat"], row["lng"]], radius=8, color=color, fill=True, fill_color=color, popup=row["name"]
        ).add_to(m)
        folium.Circle([row["lat"], row["lng"]], radius=500, color="#3B82F6", fill=False, opacity=0.35).add_to(m)
    m.save(OUT_DIR / "camera_network_map.html")



def plot_animation_frames() -> None:
    frames = [
        ("Step 1: Camera Capture", "T+0ms", "#DBEAFE"),
        ("Step 2: ALPR Recognition", "T+500ms", "#FEF3C7"),
        ("Step 3: Database Match", "T+1000ms", "#D1FAE5"),
        ("Step 4: Notification Sent", "T+3000ms", "#E0E7FF"),
    ]
    images = []
    for idx, (title, subtitle, bgcolor) in enumerate(frames, start=1):
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax.transAxes, facecolor=bgcolor))
        ax.text(0.5, 0.78, title, ha="center", va="center", transform=ax.transAxes, fontsize=18, fontweight="bold")
        ax.text(0.5, 0.63, subtitle, ha="center", va="center", transform=ax.transAxes, fontsize=12)
        ax.text(0.5, 0.38, f"Illustration {idx}", ha="center", va="center", transform=ax.transAxes, fontsize=24, fontweight="bold", bbox=dict(boxstyle="round,pad=0.5", facecolor="white", edgecolor="#1E3A8A"))
        ax.axis("off")
        frame = OUT_DIR / f"frame_{idx}.png"
        plt.savefig(frame, dpi=150, bbox_inches="tight")
        plt.close()
        images.append(imageio.imread(frame))
        frame.unlink(missing_ok=True)
    imageio.mimsave(OUT_DIR / "violation_detection_animation.gif", images, duration=1)


def _base_diagram(title: str, size: tuple[int, int] = (16, 9)) -> tuple[plt.Figure, plt.Axes]:
    fig, ax = plt.subplots(figsize=size)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.text(0.5, 0.965, title, ha="center", va="top", fontsize=18, fontweight="bold", color="#111827")
    return fig, ax


def _box(ax: plt.Axes, xy: tuple[float, float], w: float, h: float, text: str, *, fc: str, ec: str = "#1F2937", fontsize: int = 11, weight: str = "normal", radius: float = 0.02) -> None:
    box = patches.FancyBboxPatch(
        xy,
        w,
        h,
        boxstyle=f"round,pad=0.012,rounding_size={radius}",
        linewidth=1.8,
        edgecolor=ec,
        facecolor=fc,
    )
    ax.add_patch(box)
    ax.text(xy[0] + w / 2, xy[1] + h / 2, text, ha="center", va="center", fontsize=fontsize, fontweight=weight, color="#111827")


def _arrow(ax: plt.Axes, start: tuple[float, float], end: tuple[float, float], text: str = "", *, color: str = "#374151") -> None:
    ax.annotate(
        "",
        xy=end,
        xytext=start,
        arrowprops=dict(arrowstyle="->", lw=1.8, color=color, shrinkA=0, shrinkB=0),
    )
    if text:
        mid_x = (start[0] + end[0]) / 2
        mid_y = (start[1] + end[1]) / 2
        ax.text(mid_x, mid_y + 0.015, text, ha="center", va="bottom", fontsize=9, color=color)


def render_architecture_diagram() -> None:
    fig, ax = _base_diagram("System Architecture Diagram")
    _box(ax, (0.05, 0.72), 0.18, 0.11, "Roadside\nCameras", fc="#DBEAFE", fontsize=11, weight="bold")
    _box(ax, (0.05, 0.54), 0.18, 0.11, "Traffic\nSensors", fc="#DBEAFE", fontsize=11, weight="bold")
    _box(ax, (0.05, 0.36), 0.18, 0.11, "Smart Traffic\nSignals", fc="#DBEAFE", fontsize=11, weight="bold")

    _box(ax, (0.31, 0.72), 0.18, 0.11, "ALPR\nEngine", fc="#FEF3C7", fontsize=11, weight="bold")
    _box(ax, (0.31, 0.54), 0.18, 0.11, "Rule\nEngine", fc="#FEF3C7", fontsize=11, weight="bold")
    _box(ax, (0.31, 0.36), 0.18, 0.11, "Next.js API\nRoutes", fc="#FEF3C7", fontsize=11, weight="bold")
    _box(ax, (0.31, 0.18), 0.18, 0.11, "Notification\nEngine", fc="#FEF3C7", fontsize=11, weight="bold")

    _box(ax, (0.56, 0.45), 0.14, 0.16, "MongoDB\nAtlas", fc="#D1FAE5", fontsize=12, weight="bold")
    _box(ax, (0.76, 0.72), 0.18, 0.11, "Admin\nDashboard", fc="#FCE7F3", fontsize=11, weight="bold")
    _box(ax, (0.76, 0.54), 0.18, 0.11, "Driver\nPortal", fc="#FCE7F3", fontsize=11, weight="bold")
    _box(ax, (0.76, 0.36), 0.18, 0.11, "Police\nApp", fc="#FCE7F3", fontsize=11, weight="bold")
    _box(ax, (0.76, 0.18), 0.18, 0.11, "Payment\nGateway", fc="#F3E8FF", fontsize=11, weight="bold")

    _arrow(ax, (0.23, 0.775), (0.31, 0.775), "Images")
    _arrow(ax, (0.23, 0.595), (0.31, 0.595), "Speed/Count")
    _arrow(ax, (0.23, 0.415), (0.31, 0.415), "Status")
    _arrow(ax, (0.49, 0.775), (0.56, 0.53), "Plate + Image")
    _arrow(ax, (0.49, 0.595), (0.56, 0.53), "Violation")
    _arrow(ax, (0.49, 0.415), (0.56, 0.53), "CRUD")
    _arrow(ax, (0.49, 0.235), (0.56, 0.53), "Alerts")
    _arrow(ax, (0.70, 0.53), (0.76, 0.775), "Analytics")
    _arrow(ax, (0.70, 0.50), (0.76, 0.595), "Tickets")
    _arrow(ax, (0.70, 0.47), (0.76, 0.415), "Reports")
    _arrow(ax, (0.70, 0.44), (0.76, 0.235), "Payments")

    save_fig("diagram_system_architecture.png")


def render_dfd_level0() -> None:
    fig, ax = _base_diagram("DFD Level 0 - Context Diagram")
    _box(ax, (0.37, 0.42), 0.26, 0.16, "Traffic Management\nSystem", fc="#E1F9FF", fontsize=14, weight="bold")
    _box(ax, (0.05, 0.70), 0.16, 0.10, "Traffic Police", fc="#FFE4E1", fontsize=10, weight="bold")
    _box(ax, (0.05, 0.48), 0.16, 0.10, "Admin", fc="#E1F5E1", fontsize=10, weight="bold")
    _box(ax, (0.05, 0.26), 0.16, 0.10, "Drivers", fc="#E1E5FF", fontsize=10, weight="bold")
    _box(ax, (0.79, 0.70), 0.16, 0.10, "Cameras", fc="#FFF9E1", fontsize=10, weight="bold")
    _box(ax, (0.79, 0.48), 0.16, 0.10, "Payment\nGateway", fc="#F3E1FF", fontsize=10, weight="bold")
    _arrow(ax, (0.21, 0.75), (0.37, 0.52), "Manual reports")
    _arrow(ax, (0.21, 0.53), (0.37, 0.50), "Configuration")
    _arrow(ax, (0.21, 0.31), (0.37, 0.48), "Vehicle info")
    _arrow(ax, (0.79, 0.75), (0.63, 0.53), "Violation images")
    _arrow(ax, (0.79, 0.53), (0.63, 0.49), "Payment status")
    _arrow(ax, (0.50, 0.42), (0.50, 0.28), "Notifications")
    _arrow(ax, (0.50, 0.58), (0.50, 0.70), "Alerts")
    save_fig("diagram_dfd_level_0.png")


def render_dfd_level1() -> None:
    fig, ax = _base_diagram("DFD Level 1 - Process Decomposition")
    process_y = [0.72, 0.55, 0.38, 0.21]
    labels = ["1.0 Data Capture", "2.0 Violation Detection", "3.0 Fine Management", "4.0 Notification Engine"]
    for y, label in zip(process_y, labels):
        _box(ax, (0.33, y), 0.30, 0.10, label, fc="#DBEAFE", fontsize=12, weight="bold")

    _box(ax, (0.05, 0.76), 0.17, 0.09, "Camera", fc="#FFF9E1", fontsize=10, weight="bold")
    _box(ax, (0.05, 0.56), 0.17, 0.09, "Traffic Police", fc="#FFE4E1", fontsize=10, weight="bold")
    _box(ax, (0.05, 0.36), 0.17, 0.09, "Admin", fc="#E1F5E1", fontsize=10, weight="bold")
    _box(ax, (0.80, 0.76), 0.15, 0.09, "Driver", fc="#E1E5FF", fontsize=10, weight="bold")
    _box(ax, (0.80, 0.56), 0.15, 0.09, "Gateway", fc="#F3E1FF", fontsize=10, weight="bold")

    _box(ax, (0.70, 0.24), 0.18, 0.09, "D1 Vehicles", fc="#D1FAE5", fontsize=10)
    _box(ax, (0.70, 0.12), 0.18, 0.09, "D2 Violations", fc="#D1FAE5", fontsize=10)
    _box(ax, (0.48, 0.10), 0.16, 0.09, "D3 Users", fc="#D1FAE5", fontsize=10)
    _box(ax, (0.08, 0.12), 0.16, 0.09, "D4 Signals", fc="#D1FAE5", fontsize=10)
    _box(ax, (0.08, 0.24), 0.16, 0.09, "D5 Payments", fc="#D1FAE5", fontsize=10)

    _arrow(ax, (0.22, 0.81), (0.33, 0.77), "Images")
    _arrow(ax, (0.63, 0.77), (0.80, 0.81), "Tickets")
    _arrow(ax, (0.22, 0.61), (0.33, 0.60), "Manual reports")
    _arrow(ax, (0.22, 0.41), (0.33, 0.43), "Policy updates")
    _arrow(ax, (0.63, 0.60), (0.80, 0.61), "Payment confirmation")
    _arrow(ax, (0.48, 0.72), (0.48, 0.65), "Capture -> Detect")
    _arrow(ax, (0.48, 0.55), (0.48, 0.48), "Detect -> Fine")
    _arrow(ax, (0.48, 0.38), (0.48, 0.31), "Fine -> Notify")
    _arrow(ax, (0.48, 0.21), (0.48, 0.19), "User data")
    save_fig("diagram_dfd_level_1.png")


def render_use_case() -> None:
    fig, ax = _base_diagram("Use Case Diagram")
    _box(ax, (0.33, 0.14), 0.34, 0.74, "Traffic Management System", fc="#F8FAFC", ec="#1E3A8A", fontsize=13, weight="bold")
    actors = [(0.05, 0.72, "Traffic Police"), (0.05, 0.47, "Admin"), (0.05, 0.22, "Driver")]
    use_cases = [
        (0.40, 0.75, "Authenticate\n& Login"),
        (0.40, 0.63, "Record Violation\nManually"),
        (0.40, 0.51, "Search Vehicle\nby Plate"),
        (0.40, 0.39, "View Analytics\n& Reports"),
        (0.40, 0.27, "Manage Users\n& Roles"),
        (0.70, 0.75, "Approve\nService Requests"),
        (0.70, 0.63, "View Vehicle\nProfile"),
        (0.70, 0.51, "Pay Fine\nOnline"),
        (0.70, 0.39, "Receive\nNotifications"),
        (0.70, 0.27, "View Payment\nHistory"),
    ]
    for x, y, txt in actors:
        _box(ax, (x, y), 0.16, 0.09, txt, fc="#E5E7EB", fontsize=10, weight="bold")
    for x, y, txt in use_cases:
        _box(ax, (x, y), 0.18, 0.09, txt, fc="#DBEAFE", fontsize=10)

    links = [
        ((0.21, 0.765), (0.40, 0.79)),
        ((0.21, 0.765), (0.40, 0.67)),
        ((0.21, 0.515), (0.40, 0.55)),
        ((0.21, 0.515), (0.40, 0.43)),
        ((0.21, 0.515), (0.40, 0.31)),
        ((0.21, 0.265), (0.70, 0.55)),
        ((0.21, 0.265), (0.70, 0.67)),
        ((0.21, 0.265), (0.70, 0.79)),
        ((0.21, 0.265), (0.70, 0.43)),
        ((0.21, 0.265), (0.70, 0.31)),
    ]
    for start, end in links:
        _arrow(ax, start, end)
    save_fig("diagram_use_case.png")


def render_class_diagram() -> None:
    fig, ax = _base_diagram("Class Diagram")
    positions = {
        "User": (0.06, 0.70),
        "Driver": (0.35, 0.76),
        "TrafficPolice": (0.62, 0.76),
        "Admin": (0.82, 0.76),
        "Vehicle": (0.15, 0.36),
        "Violation": (0.42, 0.36),
        "Payment": (0.67, 0.36),
        "Notification": (0.82, 0.36),
    }
    for name, (x, y) in positions.items():
        _box(ax, (x, y), 0.16, 0.14, name, fc="#EFF6FF", fontsize=12, weight="bold")

    _arrow(ax, (0.14, 0.70), (0.23, 0.50), "inherits")
    _arrow(ax, (0.43, 0.76), (0.23, 0.50), "inherits")
    _arrow(ax, (0.70, 0.76), (0.23, 0.50), "inherits")
    _arrow(ax, (0.23, 0.42), (0.42, 0.42), "owns")
    _arrow(ax, (0.31, 0.42), (0.42, 0.42), "records")
    _arrow(ax, (0.58, 0.42), (0.67, 0.42), "settles")
    _arrow(ax, (0.58, 0.42), (0.82, 0.42), "triggers")
    save_fig("diagram_class.png")


def render_er_diagram() -> None:
    fig, ax = _base_diagram("ER Diagram")
    entities = {
        "USERS": (0.07, 0.70, "#DBEAFE"),
        "VEHICLES": (0.37, 0.70, "#D1FAE5"),
        "VIOLATIONS": (0.67, 0.70, "#FCE7F3"),
        "SIGNALS": (0.07, 0.30, "#FEF3C7"),
        "PAYMENTS": (0.37, 0.30, "#EDE9FE"),
        "NOTIFICATIONS": (0.67, 0.30, "#F3F4F6"),
    }
    for name, (x, y, color) in entities.items():
        _box(ax, (x, y), 0.18, 0.14, name, fc=color, fontsize=12, weight="bold")
    _arrow(ax, (0.25, 0.77), (0.37, 0.77), "owns")
    _arrow(ax, (0.55, 0.77), (0.67, 0.77), "involved_in")
    _arrow(ax, (0.16, 0.70), (0.16, 0.44), "monitors")
    _arrow(ax, (0.46, 0.70), (0.46, 0.44), "settled_by")
    _arrow(ax, (0.76, 0.70), (0.76, 0.44), "triggers")
    _arrow(ax, (0.25, 0.37), (0.37, 0.37), "makes")
    _arrow(ax, (0.55, 0.37), (0.67, 0.37), "receives")
    save_fig("diagram_er.png")


def render_sequence_diagram() -> None:
    fig, ax = _base_diagram("Sequence Diagram")
    lanes = ["Camera", "ALPR", "Rule Engine", "MongoDB", "Notification", "Driver"]
    xs = np.linspace(0.08, 0.92, len(lanes))
    for x, label in zip(xs, lanes):
        ax.plot([x, x], [0.14, 0.88], linestyle="--", color="#9CA3AF", linewidth=1)
        ax.text(x, 0.90, label, ha="center", va="bottom", fontweight="bold")
    steps = [
        (0, 1, 0.82, "Image captured"),
        (1, 2, 0.72, "Plate extracted"),
        (2, 3, 0.62, "Query vehicle"),
        (3, 2, 0.52, "Vehicle found"),
        (2, 3, 0.42, "Create violation"),
        (2, 4, 0.32, "Trigger notification"),
        (4, 5, 0.22, "Send SMS/Email"),
    ]
    for start_idx, end_idx, y, label in steps:
        _arrow(ax, (xs[start_idx], y), (xs[end_idx], y), label)
    save_fig("diagram_sequence.png")


def render_state_diagram() -> None:
    fig, ax = _base_diagram("Adaptive Signal State Diagram")
    _box(ax, (0.10, 0.72), 0.22, 0.12, "FixedPhase1\nN-S Green 60s", fc="#DBEAFE", fontsize=11, weight="bold")
    _box(ax, (0.38, 0.72), 0.24, 0.12, "AdaptiveEval1\nAnalyze queues", fc="#FEF3C7", fontsize=11, weight="bold")
    _box(ax, (0.68, 0.72), 0.22, 0.12, "AdaptivePhase1\nExtend N-S 80s", fc="#D1FAE5", fontsize=11, weight="bold")
    _box(ax, (0.18, 0.42), 0.22, 0.12, "AdaptivePhase2\nE-W Green 50s", fc="#E0E7FF", fontsize=11, weight="bold")
    _box(ax, (0.50, 0.42), 0.26, 0.12, "AdaptiveEval2\nRe-optimize timings", fc="#FEF3C7", fontsize=11, weight="bold")
    _box(ax, (0.34, 0.16), 0.28, 0.12, "AdaptivePhase3\nShift priority", fc="#D1FAE5", fontsize=11, weight="bold")
    _arrow(ax, (0.32, 0.78), (0.38, 0.78), "phase ends")
    _arrow(ax, (0.62, 0.78), (0.68, 0.78), "extend")
    _arrow(ax, (0.79, 0.72), (0.29, 0.54), "queue update")
    _arrow(ax, (0.29, 0.42), (0.50, 0.48), "re-optimize")
    _arrow(ax, (0.63, 0.42), (0.48, 0.28), "shift priority")
    _arrow(ax, (0.48, 0.16), (0.59, 0.48), "continuous loop")
    save_fig("diagram_adaptive_signal_state.png")


def render_alpr_pipeline() -> None:
    fig, ax = _base_diagram("ALPR Pipeline")
    stages = [
        (0.05, 0.72, 0.16, 0.10, "Camera Capture"),
        (0.25, 0.72, 0.16, 0.10, "Plate Detection"),
        (0.45, 0.72, 0.16, 0.10, "OCR Recognition"),
        (0.65, 0.72, 0.16, 0.10, "Database Match"),
        (0.25, 0.42, 0.20, 0.10, "Rule Evaluation"),
        (0.50, 0.42, 0.18, 0.10, "Fine Generation"),
        (0.74, 0.42, 0.18, 0.10, "Notification"),
    ]
    for x, y, w, h, txt in stages:
        _box(ax, (x, y), w, h, txt, fc="#DBEAFE" if y > 0.6 else "#FCE7F3", fontsize=11, weight="bold")
    _arrow(ax, (0.21, 0.77), (0.25, 0.77))
    _arrow(ax, (0.41, 0.77), (0.45, 0.77))
    _arrow(ax, (0.61, 0.77), (0.65, 0.77))
    _arrow(ax, (0.73, 0.72), (0.35, 0.52), "violation?", color="#EF4444")
    _arrow(ax, (0.45, 0.47), (0.50, 0.47))
    _arrow(ax, (0.68, 0.47), (0.74, 0.47))
    save_fig("diagram_alpr_pipeline.png")



def main() -> None:
    hourly, violation_types, density = build_sample_data()
    plot_hourly(hourly)
    plot_violation_types(violation_types)
    plot_before_after()
    plot_hotspot_map(density)
    plot_travel_time_boxplot()
    plot_scatter()
    plot_camera_map()
    plot_animation_frames()
    render_architecture_diagram()
    render_dfd_level0()
    render_dfd_level1()
    render_use_case()
    render_class_diagram()
    render_er_diagram()
    render_sequence_diagram()
    render_state_diagram()
    render_alpr_pipeline()
    print(f"Generated visuals in {OUT_DIR}")


if __name__ == "__main__":
    main()
