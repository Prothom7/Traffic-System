# Traffic-System

A full‑stack web platform for managing vehicle registration, traffic violations, accidents, and ownership services. Built using **Next.js**, the system simulates a digital traffic authority portal where citizens and administrators can interact with real‑time vehicle and violation data.

---

## 🚀 Features

### Citizen Services

* Transfer vehicle ownership
* Renew vehicle registration online
* Update vehicle or owner information
* Report a stolen vehicle
* View current registration status
* View all transactions & payments
* Track tickets, payment status & driving credit score
* Track stolen vehicle status and sightings

### Traffic Monitoring & Enforcement

* Live camera location map
* Search traffic records
* View violation records
* Accident & traffic violation news feed
* Simulate violation event (admin testing tool)

### Administrative Tools

* Vehicle registry management
* Violation record management
* Traffic monitoring dashboard
* Event simulation for testing enforcement logic

---

## 🧠 System Purpose

This project demonstrates how a **digital traffic authority system** could operate in a smart‑city environment. It integrates vehicle records, enforcement automation, and citizen self‑service tools into a single unified platform.


---

## 🧪 Demo Admin Testing Page

Simulate violation events:

```
http://localhost:3000/admin/simulate-violation
```

Used to test automated ticket generation and enforcement workflows.

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```
git clone https://github.com/Prothom7/Traffic-System.git
cd Traffic-System
```

### 2️⃣ Install Dependencies

```
npm install
```

### 3️⃣ Environment Variables

Create `.env.local`

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Optional: AI plate extraction in admin simulation
ALPR_PYTHON_EXECUTABLE=python
ALPR_PYTHON_ARGS=
# Optional: override defaults. If omitted, app auto-loads from ./Hybrid Pipeline/
# ALPR_MODELS_DIR=Hybrid Pipeline\\models
# ALPR_CITY_LABEL_FILE=Hybrid Pipeline\\label_city
# ALPR_CHAR_LABEL_FILE=Hybrid Pipeline\\label_char
# Optional JSON fallback if label files are not present
# ALPR_CITY_ANNOTATIONS=Hybrid Pipeline\\annotations\\city_final.json
# ALPR_CHAR_ANNOTATIONS=Hybrid Pipeline\\annotations\\ocr_char.json
# Optional Windows fix for OpenMP duplicate runtime issue
KMP_DUPLICATE_LIB_OK=TRUE

# Optional: Use dedicated FastAPI ML server instead of spawning Python per request
ALPR_USE_FASTAPI=true
ALPR_FASTAPI_URL=http://localhost:8000/predict
NEXT_PUBLIC_ALPR_FASTAPI_URL=http://localhost:8000/predict
```

Install Python packages for the extraction pipeline:

```bash
pip install torch torchvision ultralytics opencv-python pillow numpy
```

The project now auto-resolves model and label files from `Hybrid Pipeline/` in this repository. You only need ALPR_* env vars if your files are stored elsewhere.

Required model files inside ALPR_MODELS_DIR:

```text
yolo_plate.pt
classification_city.pth
classification_char.pth
ocr_digit.pth
```

Labels:

```text
Option A (recommended): ALPR_CITY_LABEL_FILE + ALPR_CHAR_LABEL_FILE
Option B: ALPR_CITY_ANNOTATIONS + ALPR_CHAR_ANNOTATIONS
```

### Start Machine Learning Server (FastAPI)

Run the standalone Python inference server so models are loaded once at startup.

From the project root (Windows Command Prompt / CMD):

```bat
cd ml_service
python -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

From the project root (Windows PowerShell):

```powershell
cd ml_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Quick health check (new PowerShell terminal):

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Available endpoints:

```text
GET  /health
POST /predict   (multipart/form-data with image)
```

System flow:

```text
Next.js upload -> /api/admin/violations/extract-plate -> FastAPI /predict -> plate JSON -> UI
```

For direct frontend testing, open:

```text
/admin/ml-predict
```

### 4️⃣ Run Development Server

```
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🔐 User Roles

| Role            | Permissions                      |
| --------------- | -------------------------------- |
| Citizen         | Manage own vehicle & violations  |
| Admin           | Full system control & simulation |

---

## 📊 Example Workflows

### Register → Violate → Ticket → Pay

1. Vehicle registered
2. Camera detects violation
3. Ticket generated automatically
4. Citizen notified
5. Payment recorded
6. Driving score updated

### Stolen Vehicle Tracking

1. User reports vehicle stolen
2. Vehicle flagged in system
3. Cameras scan plates
4. Sightings recorded on map

---

## 🎯 Goals of the Project

* Smart city traffic automation concept
* Demonstrate digital governance systems
* Practice full‑stack Next.js architecture
* Real‑world CRUD + event‑driven workflows

---

## 📌 Future Improvements

* AI number plate detection
* Mobile app integration
* Real payment gateway integration
* Real camera feeds
* Police officer mobile dashboard

---

## 📄 License

This project is for educational and demonstration purposes.
