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
