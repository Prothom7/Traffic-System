# Traffic System Visual Assets
## Mermaid Diagram Templates & Examples

Copy-paste ready Mermaid code for all system diagrams.

---

## 1. SYSTEM ARCHITECTURE DIAGRAM

**Purpose:** Show complete system layers and data flow
**Usage:** Save as `.mmd` file and render with Mermaid Live Editor or VS Code extension

```mermaid
graph TB
    subgraph Sensing["🎥 SENSING LAYER (Field Devices)"]
        CAM["Roadside Cameras<br/>(ALPR enabled)"]
        SEN["Traffic Sensors<br/>(Speed, Density)"]
        SIG["Smart Traffic Signals<br/>(Connected)"]
    end
    
    subgraph Processing["⚙️ PROCESSING LAYER (Backend)"]
        API["Next.js API Routes<br/>Port 3000"]
        ALPR["ALPR Engine<br/>(Python ML Service)"]
        RULES["Violation Rule Engine<br/>(12 rule types)"]
        AUTH["Auth Service<br/>(JWT)"]
        NOTIFY["Notification Engine<br/>(SMS, Email, App)"]
    end
    
    subgraph Storage["💾 STORAGE LAYER"]
        DB[("MongoDB Atlas<br/>12 Collections<br/>2M+ Records")]
    end
    
    subgraph Users["👥 USER LAYER"]
        ADMIN["Admin Dashboard<br/>(Analytics, Config)"]
        DRIVER["Driver Portal<br/>(View Tickets, Pay)"]
        POLICE["Police App<br/>(Enforcement)"]
    end
    
    subgraph External["🔗 EXTERNAL SERVICES"]
        PAYMENT["Payment Gateway<br/>(Easypaisa, JazzCash)"]
        EMAIL["Email/SMS Service<br/>(Nodemailer)"]
    end
    
    %% Data flows
    CAM -->|Images| ALPR
    SEN -->|Speed, Count| RULES
    ALPR -->|Plate + Image| RULES
    RULES -->|Violation Event| API
    API -->|Query/Update| AUTH
    API <-->|CRUD| DB
    DB -->|Aggregated Data| ADMIN
    DB -->|Real-time Events| NOTIFY
    NOTIFY -->|SSE Stream| DRIVER
    NOTIFY -->|SMS/Email| EMAIL
    API -->|Redirect| PAYMENT
    PAYMENT -->|Confirmation| API
    API <-->|Queries| DRIVER
    API <-->|Reports| POLICE
    API <-->|Config| ADMIN
    SIG -->|Signal Status| API
    
    style Sensing fill:#DBEAFE,stroke:#1E3A8A,stroke-width:2px,color:#000
    style Processing fill:#FEF3C7,stroke:#92400E,stroke-width:2px,color:#000
    style Storage fill:#D1FAE5,stroke:#065F46,stroke-width:2px,color:#000
    style Users fill:#FCE7F3,stroke:#831843,stroke-width:2px,color:#000
    style External fill:#F3E8FF,stroke:#5B21B6,stroke-width:2px,color:#000
```

---

## 2. DATA FLOW DIAGRAM - LEVEL 0 (Context)

```mermaid
graph LR
    A["👮 Traffic Police"]
    B["👨‍💼 Admin"]
    C["🚗 Drivers"]
    CAM["📷 Cameras"]
    GW["💳 Payment Gateway"]
    
    SYSTEM{{"🌐<br/>TRAFFIC<br/>MANAGEMENT<br/>SYSTEM"}}
    
    DS1[("🗃️ D1<br/>Vehicles")]
    DS2[("🗃️ D2<br/>Violations")]
    DS3[("🗃️ D3<br/>Users")]
    DS4[("🗃️ D4<br/>Signals")]
    DS5[("🗃️ D5<br/>Payments")]
    
    A -->|Manual reports, enforcement queries| SYSTEM
    B -->|Configuration, approvals| SYSTEM
    C -->|Vehicle info, payment requests| SYSTEM
    CAM -->|Violation images| SYSTEM
    GW -->|Payment status| SYSTEM
    
    SYSTEM -->|Tickets, alerts| A
    SYSTEM -->|Analytics, reports| B
    SYSTEM -->|Notifications, status| C
    
    SYSTEM <-->|Read/Write| DS1
    SYSTEM <-->|Read/Write| DS2
    SYSTEM <-->|Read/Write| DS3
    SYSTEM <-->|Read/Write| DS4
    SYSTEM <-->|Read/Write| DS5
    
    style A fill:#FFE4E1
    style B fill:#E1F5E1
    style C fill:#E1E5FF
    style CAM fill:#FFF9E1
    style GW fill:#F3E1FF
    style SYSTEM fill:#E1F9FF,stroke:#1E3A8A,stroke-width:3px
    style DS1 fill:#D1FAE5
    style DS2 fill:#D1FAE5
    style DS3 fill:#D1FAE5
    style DS4 fill:#D1FAE5
    style DS5 fill:#D1FAE5
```

---

## 3. DATA FLOW DIAGRAM - LEVEL 1 (Processes)

```mermaid
graph TD
    %% External entities
    DR["👤 Driver"]
    TP["👮 Traffic Police"]
    AD["👨‍💼 Admin"]
    GW["💳 Payment Gateway"]
    CAM["📷 Camera"]
    
    %% Processes
    P1["1.0 Data Capture<br/>Collect sensor/camera data"]
    P2["2.0 Violation Detection<br/>ALPR + Rule Engine"]
    P3["3.0 Fine Management<br/>Ticket generation"]
    P4["4.0 Notification Engine<br/>Alerts & Communications"]
    P5["5.0 User Management<br/>Auth & Access Control"]
    
    %% Data stores
    DS1[("D1: Vehicles")]
    DS2[("D2: Violations")]
    DS3[("D3: Users")]
    DS4[("D4: Signals")]
    DS5[("D5: Payments")]
    
    %% Data flows
    CAM -->|Images| P1
    P1 -->|Plate + Image| P2
    P1 <-->|Vehicle data| DS1
    P1 <-->|Signal data| DS4
    
    P2 -->|Detected violation| P3
    P2 <-->|Query vehicles| DS1
    P2 <-->|Store violation| DS2
    
    TP -->|Manual reports| P2
    
    P3 -->|Ticket details| P4
    P3 <-->|Create fine| DS2
    P3 <-->|Payment request| DS5
    
    P4 -->|Violation notice| DR
    P4 -->|Operational alerts| TP
    P4 -->|Admin reports| AD
    
    GW -->|Payment confirmation| P3
    
    AD -->|Policy updates| P5
    DR <-->|Auth requests| P5
    TP <-->|Auth requests| P5
    P5 <-->|User data| DS3
    
    P3 -->|Payment link| GW
    
    style P1 fill:#DBEAFE,stroke:#1E3A8A,stroke-width:2px
    style P2 fill:#DBEAFE,stroke:#1E3A8A,stroke-width:2px
    style P3 fill:#DBEAFE,stroke:#1E3A8A,stroke-width:2px
    style P4 fill:#DBEAFE,stroke:#1E3A8A,stroke-width:2px
    style P5 fill:#DBEAFE,stroke:#1E3A8A,stroke-width:2px
```

---

## 4. SEQUENCE DIAGRAM - VIOLATION LIFECYCLE

```mermaid
sequenceDiagram
    actor CAM as Camera
    participant ALPR as ALPR Service
    participant RULE as Rule Engine
    participant DB as MongoDB
    participant MAIL as Notification Service
    actor DRV as Driver
    
    CAM->>ALPR: 📷 Image captured<br/>(T+0ms)
    ALPR->>ALPR: License plate detection<br/>Confidence: 97%
    ALPR->>RULE: Plate: ABC-1234<br/>(T+500ms)
    RULE->>DB: Query vehicle by plate
    DB-->>RULE: Vehicle found<br/>Owner: Ali Ahmed<br/>Type: Corolla
    RULE->>RULE: Check rules:<br/>Speed 65 > Limit 50<br/>Overage: +15%
    RULE->>RULE: Calculate fine:<br/>Base: 1500 + Overage: 500<br/>Total: 2000 PKR<br/>(T+1000ms)
    RULE->>DB: Create violation record
    RULE->>MAIL: Trigger notification
    MAIL->>MAIL: Format message
    MAIL->>DRV: 📱 SMS: Ticket ABC-1234<br/>Speed: 65/50 km/h<br/>Fine: 2000 PKR<br/>Pay by: May 9<br/>(T+3000ms)
    DRV->>DB: Pay fine online<br/>(T+24-36 hours)
    DB-->>DRV: ✓ Payment confirmed
```

---

## 5. USE CASE DIAGRAM

```mermaid
graph TB
    A["👮 Traffic Police"]
    B["👨‍💼 Admin"]
    C["🚗 Driver"]
    
    subgraph SYS["🌐 Traffic Management System"]
        UC1["🔑 Authenticate<br/>& Login"]
        UC2["📝 Record Violation<br/>Manually"]
        UC3["🔍 Search Vehicle<br/>by Plate"]
        UC4["📊 View Analytics<br/>& Reports"]
        UC5["👥 Manage Users<br/>& Roles"]
        UC6["✅ Approve<br/>Service Requests"]
        UC7["🚗 View Vehicle<br/>Profile"]
        UC8["💰 Pay Fine<br/>Online"]
        UC9["📱 Receive<br/>Notifications"]
        UC10["💳 View Payment<br/>History"]
        UC11["🔧 Manage System<br/>Configuration"]
    end
    
    A --> UC1
    A --> UC2
    A --> UC3
    A --> UC4
    A --> UC7
    
    B --> UC1
    B --> UC4
    B --> UC5
    B --> UC6
    B --> UC11
    
    C --> UC1
    C --> UC7
    C --> UC8
    C --> UC9
    C --> UC10
    
    UC1 -.includes.- UC2
    UC1 -.includes.- UC8
    UC2 -.triggers.- UC9
    UC8 -.triggers.- UC10
    
    style UC1 fill:#FBBF24
    style UC2 fill:#EF4444
    style UC3 fill:#3B82F6
    style UC4 fill:#10B981
    style UC5 fill:#8B5CF6
```

---

## 6. CLASS DIAGRAM (OOP Model)

```mermaid
classDiagram
    class User {
        string user_id
        string name
        string email
        string phone
        string role
        DateTime created_at
        +login()
        +updateProfile()
        +logout()
    }
    
    class Driver {
        string license_number
        string address
        +viewViolations()
        +payFine()
        +requestRenewal()
    }
    
    class TrafficPolice {
        string badge_number
        +recordViolation()
        +validateEvidence()
        +viewAnalytics()
    }
    
    class Admin {
        +manageUsers()
        +approveRequests()
        +configureRules()
    }
    
    class Vehicle {
        string vehicle_id
        string plate_number
        string model
        string owner_id
        DateTime registration_expiry
        string status
        +register()
        +updateOwnership()
        +requestRenewal()
    }
    
    class Violation {
        string violation_id
        string vehicle_id
        DateTime timestamp
        string location
        string type
        float speed_recorded
        float speed_limit
        float fine_amount
        string status
        +generateFine()
        +sendNotification()
    }
    
    class Payment {
        string payment_id
        string violation_id
        float amount
        string method
        string status
        DateTime paid_at
        +process()
        +verify()
    }
    
    class Notification {
        string notification_id
        string user_id
        string message
        string channel
        DateTime sent_at
        +send()
    }
    
    User <|-- Driver
    User <|-- TrafficPolice
    User <|-- Admin
    
    Driver "1" --> "0..*" Vehicle : owns
    Vehicle "1" --> "0..*" Violation : involved_in
    TrafficPolice "1" --> "0..*" Violation : records
    Violation "1" --> "0..1" Payment : settled_by
    Violation "1" --> "0..*" Notification : triggers
```

---

## 7. ENTITY-RELATIONSHIP DIAGRAM

```mermaid
erDiagram
    USERS {
        string user_id PK
        string name
        string email
        string phone
        string role
        datetime created_at
    }
    
    VEHICLES {
        string vehicle_id PK
        string plate_number
        string model
        string owner_id FK
        datetime registration_date
        string status
    }
    
    VIOLATIONS {
        string violation_id PK
        string vehicle_id FK
        string officer_id FK
        datetime timestamp
        string type
        float speed_recorded
        float speed_limit
        float fine_amount
        string status
    }
    
    SIGNALS {
        string signal_id PK
        string location
        string current_state
        datetime last_updated
    }
    
    PAYMENTS {
        string payment_id PK
        string violation_id FK
        string payer_id FK
        float amount
        string method
        string status
        datetime paid_at
    }
    
    NOTIFICATIONS {
        string notification_id PK
        string user_id FK
        string violation_id FK
        string message
        string channel
        datetime sent_at
    }
    
    RENEWAL_REQUESTS {
        string request_id PK
        string user_id FK
        string vehicle_id FK
        string status
        datetime requested_at
    }
    
    USERS ||--o{ VEHICLES : owns
    USERS ||--o{ VIOLATIONS : records
    USERS ||--o{ PAYMENTS : makes
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ RENEWAL_REQUESTS : requests
    
    VEHICLES ||--o{ VIOLATIONS : involved_in
    SIGNALS ||--o{ VIOLATIONS : monitors
    VIOLATIONS ||--o| PAYMENTS : settled_by
    VIOLATIONS ||--o{ NOTIFICATIONS : triggers
```

---

## 8. FLOWCHART - VIOLATION DETECTION & PAYMENT WORKFLOW

```mermaid
flowchart TD
    A["🎥 Camera Detects Vehicle"] --> B["📸 Capture High-Res Image<br/>(2048×2048px)"]
    B --> C{Speed ><br/>Limit?}
    
    C -->|No| D["✓ Normal vehicle<br/>No action"]
    C -->|Yes| E["⚠️ Speed Violation<br/>Detected"]
    
    E --> F["🔍 ALPR Recognition<br/>License Plate Extraction"]
    F --> G{Plate<br/>Recognized?}
    
    G -->|Failed| H["❌ Could not read plate<br/>File for manual review"]
    G -->|Success| I["✓ Plate: ABC-1234"]
    
    I --> J["🗄️ Database Lookup<br/>Query vehicle records"]
    J --> K{Vehicle<br/>Found?}
    
    K -->|Not Found| L["❓ Unregistered vehicle<br/>Escalate to police"]
    K -->|Found| M["✓ Owner: Ali Ahmed<br/>Vehicle: 2020 Toyota"]
    
    M --> N["⚖️ Apply Violation Rules<br/>Fine Calculation"]
    N --> O["💰 Fine: 2,000 PKR<br/>Due: 15 days"]
    
    O --> P["💾 Store in Database<br/>Create violation record"]
    P --> Q["📱 Send Notification<br/>SMS + Email + App"]
    
    Q --> R["✓ Driver Receives<br/>Ticket Alert"]
    
    R --> S{Driver<br/>Action?}
    
    S -->|Pay Now| T["💳 Payment Gateway<br/>Online payment"]
    S -->|Pay Later| U["⏰ Grace Period<br/>15 days"]
    S -->|Dispute| V["📋 Appeal Process<br/>Manual review"]
    
    T --> W["✓ Payment Confirmed<br/>Violation Closed"]
    U --> X{Paid<br/>On Time?}
    
    X -->|Yes| W
    X -->|No| Y["⚖️ Case Escalation<br/>Legal enforcement"]
    
    V --> Z{Appeal<br/>Approved?}
    Z -->|Yes| AA["✓ Violation Dismissed"]
    Z -->|No| W
    
    style A fill:#DBEAFE
    style E fill:#FEF3C7
    style I fill:#D1FAE5
    style O fill:#FCE7F3
    style W fill:#D1FAE5
    style Y fill:#FEE2E2
```

---

## 9. ADAPTIVE SIGNAL CONTROL STATE MACHINE

```mermaid
stateDiagram-v2
    [*] --> FixedPhase1
    
    FixedPhase1: Phase 1: N-S Green<br/>Duration: 60s (fixed)
    WaitPhase1: Monitoring demand<br/>Vehicle count: N-S=12, E-W=8
    FixedPhase1 --> WaitPhase1: Phase ends at 60s
    
    WaitPhase1 --> AdaptiveEval1: Recalculation triggered<br/>Every 30 seconds
    AdaptiveEval1: Analyze Queue Lengths<br/>N-S: 12 vehicles (HIGH)<br/>E-W: 5 vehicles (LOW)<br/>Decision: Keep N-S longer
    
    AdaptiveEval1 --> AdaptivePhase1: Extend N-S Phase<br/>New duration: 80s
    AdaptivePhase1: Phase 1 (ADAPTIVE)<br/>N-S Green: 80s
    AdaptivePhase1 --> AdaptivePhase2: Phase ends
    
    AdaptivePhase2: Phase 2 (ADAPTIVE)<br/>E-W Green: 50s<br/>Adjusted from fixed 60s
    AdaptivePhase2 --> AdaptiveEval2: Queue updated<br/>N-S: 8 vehicles<br/>E-W: 15 vehicles (HIGH)
    
    AdaptiveEval2: Decision: Shift<br/>to E-W priority
    AdaptiveEval2 --> AdaptivePhase3: Reduce N-S<br/>Increase E-W
    
    AdaptivePhase3: Phase 3 (ADAPTIVE)<br/>N-S: 40s<br/>E-W: 80s
    
    AdaptivePhase3 --> AdaptiveEval2: Continuous<br/>optimization
    
    note right of AdaptivePhase1
        AI continuously monitors
        vehicle queues and
        adjusts phase timing
        within safety constraints
    end note
    
    note right of AdaptiveEval2
        Result: 46% increase in
        throughput vs fixed timing
    end note
```

---

## USAGE INSTRUCTIONS

1. Copy the Mermaid code block for desired diagram
2. Paste into one of:
   - **VS Code:** Install "Markdown Preview Mermaid Support" extension
   - **Online:** Paste at https://mermaid.live/
   - **File:** Save as `.mmd` and render with Mermaid CLI or web tool
3. Export as PNG/SVG for reports
4. Customize colors, labels, and entity names as needed

---

**Version:** 1.0  
**Last Updated:** April 24, 2026
