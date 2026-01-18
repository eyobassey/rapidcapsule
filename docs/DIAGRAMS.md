# Rapid Capsule - Visual Architecture Diagrams

> Mermaid-based visual diagrams for system architecture documentation
> Optimized for GitHub rendering, presentations, and Global Talent Visa evidence

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Service Communication](#3-service-communication)
4. [Authentication Flow](#4-authentication-flow)
5. [AI Health Checkup Flow](#5-ai-health-checkup-flow)
6. [Advanced Health Score System](#6-advanced-health-score-system)
7. [Prescription System Flow](#7-prescription-system-flow)
8. [WhatsApp Pharmacy Integration](#8-whatsapp-pharmacy-integration)
9. [Payment Processing Flow](#9-payment-processing-flow)
10. [Appointment Booking Flow](#10-appointment-booking-flow)
11. [Database Entity Relationships](#11-database-entity-relationships)
12. [Security Architecture](#12-security-architecture)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Technology Stack](#14-technology-stack)

---

## 1. System Overview

```mermaid
graph TB
    subgraph Users["👥 Users"]
        P[("🏥 Patients")]
        S[("👨‍⚕️ Specialists")]
        L[("🚑 Lifeguards")]
        A[("👔 Administrators")]
    end

    subgraph Frontend["🖥️ Frontend Layer"]
        PF["Patient App<br/>Vue.js 3 SPA<br/>Port 3000"]
        AF["Admin Portal<br/>Vue.js 3 + Vuetify 3<br/>Port 8080"]
    end

    subgraph Gateway["🔀 API Gateway"]
        NG["NGINX<br/>SSL Termination<br/>Load Balancing"]
    end

    subgraph Backend["⚙️ Backend Services"]
        PB["Patient Backend<br/>NestJS<br/>Port 5020"]
        AB["Admin Backend<br/>NestJS<br/>Port 5021"]
        WS["WebSocket Server<br/>Socket.io"]
    end

    subgraph Data["💾 Data Layer"]
        DB[("MongoDB<br/>Shared Database")]
        S3[("AWS S3<br/>File Storage")]
    end

    subgraph External["🌐 External Services"]
        INF["Infermedica AI<br/>Diagnosis Engine"]
        CL["Claude AI<br/>Health Summaries"]
        ZM["Zoom API<br/>Video Calls"]
        PS["Paystack<br/>Payments"]
        TW["Twilio/Gupshup<br/>WhatsApp & SMS"]
        TX["AWS Textract<br/>OCR"]
    end

    P --> PF
    S --> PF
    L --> PF
    A --> AF

    PF --> NG
    AF --> NG

    NG --> PB
    NG --> AB

    PB <--> WS
    AB <--> WS

    PB --> DB
    AB --> DB
    PB --> S3

    PB --> INF
    PB --> CL
    PB --> ZM
    PB --> PS
    PB --> TW
    PB --> TX

    AB --> CL

    style P fill:#e1f5fe
    style S fill:#e8f5e9
    style L fill:#fff3e0
    style A fill:#fce4ec
    style PF fill:#bbdefb
    style AF fill:#f8bbd9
    style PB fill:#c8e6c9
    style AB fill:#ffccbc
    style DB fill:#fff9c4
    style INF fill:#d1c4e9
    style CL fill:#d1c4e9
```

---

## 2. High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Applications"]
        direction LR
        Web["Web Browser"]
        Mobile["Mobile PWA"]
        WhatsApp["WhatsApp"]
    end

    subgraph CDN["Content Delivery"]
        CF["Cloudflare CDN<br/>SSL + DDoS Protection"]
    end

    subgraph LoadBalancer["Load Balancer"]
        NGINX["NGINX Reverse Proxy"]
    end

    subgraph Services["Microservices Layer"]
        direction TB
        subgraph PatientAPI["Patient API Service"]
            Auth["Auth Module"]
            Health["Health Checkup"]
            Appt["Appointments"]
            Vital["Vitals"]
            Rx["Prescriptions"]
            Pay["Payments"]
            WA["WhatsApp Handler"]
        end

        subgraph AdminAPI["Admin API Service"]
            AdminAuth["Admin Auth"]
            Dashboard["Dashboard"]
            PatientMgmt["Patient Management"]
            Analytics["Analytics"]
            ClaudeSummary["Claude Summaries"]
        end
    end

    subgraph DataStores["Data Stores"]
        MongoDB[("MongoDB Atlas")]
        Redis[("Redis Cache")]
        S3[("AWS S3")]
    end

    subgraph AIServices["AI/ML Services"]
        Infermedica["Infermedica<br/>Symptom Analysis"]
        Claude["Anthropic Claude<br/>LLM Processing"]
        Textract["AWS Textract<br/>Document OCR"]
    end

    Clients --> CF
    CF --> NGINX
    NGINX --> Services
    Services --> DataStores
    Services --> AIServices

    style Infermedica fill:#e8daef
    style Claude fill:#e8daef
    style Textract fill:#e8daef
```

---

## 3. Service Communication

```mermaid
sequenceDiagram
    participant C as Client
    participant NG as NGINX
    participant PB as Patient Backend
    participant AB as Admin Backend
    participant WS as WebSocket
    participant DB as MongoDB
    participant AI as AI Services

    C->>NG: HTTPS Request
    NG->>PB: Forward /api/*
    NG->>AB: Forward /admin-api/*

    PB->>DB: Query Data
    DB-->>PB: Return Data

    PB->>AI: AI Processing Request
    AI-->>PB: AI Response

    PB-->>NG: JSON Response
    NG-->>C: Response

    Note over C,WS: Real-time Updates
    C->>WS: WebSocket Connect
    WS->>PB: Subscribe Events
    PB-->>WS: Emit Updates
    WS-->>C: Push Notification
```

---

## 4. Authentication Flow

```mermaid
flowchart TD
    Start([User Visits App]) --> Choice{Auth Method}

    Choice -->|Email/Password| EP[Enter Credentials]
    Choice -->|Google OAuth| GO[Google Sign-In]
    Choice -->|Apple OAuth| AO[Apple Sign-In]

    EP --> Validate[Validate Credentials]
    GO --> GToken[Receive Google Token]
    AO --> AToken[Receive Apple Token]

    GToken --> VerifyOAuth[Verify OAuth Token]
    AToken --> VerifyOAuth

    Validate --> Check{Valid?}
    VerifyOAuth --> Check

    Check -->|No| Error[Return Error]
    Error --> Start

    Check -->|Yes| EmailVerified{Email Verified?}

    EmailVerified -->|No| SendOTP[Send OTP Email]
    SendOTP --> VerifyOTP[User Enters OTP]
    VerifyOTP --> MarkVerified[Mark Email Verified]
    MarkVerified --> GenerateJWT

    EmailVerified -->|Yes| GenerateJWT[Generate JWT Token]

    GenerateJWT --> TwoFA{2FA Enabled?}

    TwoFA -->|No| Success[Login Success]
    TwoFA -->|Yes| TwoFAType{2FA Type}

    TwoFAType -->|TOTP| TOTP[Enter Authenticator Code]
    TwoFAType -->|SMS| SMS[Send SMS Code]
    TwoFAType -->|Email| EmailCode[Send Email Code]

    TOTP --> Verify2FA[Verify 2FA Code]
    SMS --> Verify2FA
    EmailCode --> Verify2FA

    Verify2FA --> Valid2FA{Valid?}
    Valid2FA -->|Yes| Success
    Valid2FA -->|No| Error

    Success --> Dashboard([Access Dashboard])

    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style Error fill:#ffcdd2
    style GenerateJWT fill:#fff9c4
```

---

## 5. AI Health Checkup Flow

```mermaid
flowchart TD
    subgraph Patient["Patient Actions"]
        Start([Start Health Checkup]) --> SelectPatient[Select Patient Profile]
        SelectPatient --> EnterSymptoms[Describe Initial Symptoms]
    end

    subgraph Backend["Backend Processing"]
        EnterSymptoms --> ParseSymptoms[NLP Symptom Parsing<br/>Infermedica API]
        ParseSymptoms --> CreateSession[Create Interview Session]
        CreateSession --> GetQuestion[Get Next Question]
    end

    subgraph Interview["AI Interview Loop"]
        GetQuestion --> DisplayQ[Display Question to Patient]
        DisplayQ --> Answer[Patient Provides Answer]
        Answer --> SendAnswer[Send to Infermedica]
        SendAnswer --> Analyze{Analysis Complete?}
        Analyze -->|No| GetQuestion
        Analyze -->|Yes| GetDiagnosis[Get Diagnosis Results]
    end

    subgraph Results["Results Processing"]
        GetDiagnosis --> Triage[Determine Triage Level]
        Triage --> Conditions[List Probable Conditions]
        Conditions --> Specialists[Recommend Specialists]
        Specialists --> Emergency{Emergency?}
        Emergency -->|Yes| Alert[Trigger Emergency Alert]
        Emergency -->|No| Save[Save Health Checkup]
        Alert --> Save
    end

    subgraph AIEnhancement["Claude AI Enhancement"]
        Save --> ClaudeSummary[Generate Claude Summary]
        ClaudeSummary --> PersonalizedReport[Create Personalized Report]
        PersonalizedReport --> Display([Display Results])
    end

    style Start fill:#e3f2fd
    style Display fill:#c8e6c9
    style Alert fill:#ffcdd2
    style ClaudeSummary fill:#e8daef
    style ParseSymptoms fill:#e8daef
```

### Infermedica Interview Question Types

```mermaid
graph LR
    subgraph QuestionTypes["Question Types"]
        Single["single<br/>Yes/No/Don't Know"]
        GroupSingle["group_single<br/>Choose One"]
        GroupMultiple["group_multiple<br/>Select Multiple"]
        Duration["duration<br/>Symptom Duration"]
    end

    subgraph Evidence["Evidence Sources"]
        Initial["initial<br/>First Symptoms"]
        Interview["interview<br/>Q&A Responses"]
        Auto["auto<br/>System Generated"]
    end

    Single --> Diagnosis
    GroupSingle --> Diagnosis
    GroupMultiple --> Diagnosis
    Duration --> Diagnosis

    Diagnosis["Diagnosis Engine"]

    Initial --> Diagnosis
    Interview --> Diagnosis
    Auto --> Diagnosis

    style Diagnosis fill:#e8daef
```

---

## 6. Advanced Health Score System

```mermaid
flowchart TD
    subgraph Input["Data Collection"]
        Q1["Cardiovascular Questions<br/>Blood pressure, chest pain, heart rate"]
        Q2["Metabolic Questions<br/>Diabetes, weight, BMI"]
        Q3["Mental Wellbeing Questions<br/>Stress, sleep, anxiety"]
        Q4["Lifestyle Questions<br/>Exercise, diet, smoking, alcohol"]
        Q5["Physical Symptoms Questions<br/>Pain levels, fatigue, mobility"]
        Q6["Preventive Care Questions<br/>Checkups, vaccinations, screenings"]
    end

    subgraph Documents["Document Verification"]
        Upload["Upload Medical Documents"]
        Upload --> ClaudeVision["Claude Vision Analysis"]
        ClaudeVision --> Extract["Extract Health Metrics"]
        Extract --> Validate["Validate Document Authenticity"]
    end

    subgraph Processing["Score Calculation"]
        Q1 --> Weights["Apply Domain Weights"]
        Q2 --> Weights
        Q3 --> Weights
        Q4 --> Weights
        Q5 --> Weights
        Q6 --> Weights
        Validate --> Weights

        Weights --> Calculate["Calculate Weighted Score<br/>0-100 Scale"]
        Calculate --> Categorize{Score Category}
    end

    subgraph Categories["Health Categories"]
        Categorize -->|90-100| Excellent["Excellent<br/>🟢"]
        Categorize -->|75-89| Good["Good<br/>🟡"]
        Categorize -->|50-74| Fair["Fair<br/>🟠"]
        Categorize -->|0-49| NeedsAttention["Needs Attention<br/>🔴"]
    end

    subgraph Output["Results"]
        Excellent --> Report
        Good --> Report
        Fair --> Report
        NeedsAttention --> Report

        Report["Generate Health Report"]
        Report --> Recommendations["Personalized Recommendations"]
        Report --> Trends["Historical Trend Analysis"]
        Report --> Share["Share with Specialists"]
    end

    style ClaudeVision fill:#e8daef
    style Excellent fill:#c8e6c9
    style Good fill:#fff9c4
    style Fair fill:#ffe0b2
    style NeedsAttention fill:#ffcdd2
```

### Health Score Domain Weights

```mermaid
pie showData
    title Health Score Domain Distribution
    "Cardiovascular" : 20
    "Metabolic" : 20
    "Mental Wellbeing" : 15
    "Lifestyle" : 15
    "Physical Symptoms" : 15
    "Preventive Care" : 15
```

---

## 7. Prescription System Flow

```mermaid
flowchart TD
    subgraph Sources["Prescription Sources"]
        Specialist["Specialist Prescription<br/>After Consultation"]
        Upload["Patient Upload<br/>Photo/Document"]
        WhatsApp["WhatsApp Upload<br/>Conversational"]
    end

    subgraph OCR["Document Processing"]
        Specialist --> DirectEntry["Direct Digital Entry"]
        Upload --> TextractOCR["AWS Textract OCR"]
        WhatsApp --> TextractOCR

        TextractOCR --> Level1["Level 1: Line Extraction"]
        Level1 --> Level2["Level 2: Block Analysis"]
        Level2 --> Level3["Level 3: Form Detection"]
        Level3 --> Level4["Level 4: Table Extraction"]
        Level4 --> Level5["Level 5: Key-Value Pairs"]

        Level5 --> ParseMedications["Parse Medication Names"]
        ParseMedications --> MatchInventory["Match Against Inventory"]
    end

    subgraph Validation["Validation Layer"]
        DirectEntry --> ValidateRx["Validate Prescription"]
        MatchInventory --> ValidateRx

        ValidateRx --> CheckStock{Stock Available?}
        CheckStock -->|No| Backorder["Add to Backorder Queue"]
        CheckStock -->|Yes| CheckInteractions["Drug Interaction Check"]

        CheckInteractions --> Safe{Safe?}
        Safe -->|No| PharmacistReview["Flag for Pharmacist Review"]
        Safe -->|Yes| CreateOrder["Create Order"]

        Backorder --> CreateOrder
        PharmacistReview --> CreateOrder
    end

    subgraph Fulfillment["Order Fulfillment"]
        CreateOrder --> Payment["Process Payment"]
        Payment --> Status1["PENDING_PAYMENT"]
        Status1 --> Status2["PAYMENT_CONFIRMED"]
        Status2 --> Status3["PROCESSING"]
        Status3 --> Status4["READY_FOR_PICKUP"]
        Status4 --> Choice{Delivery Method}

        Choice -->|Pickup| Pickup["Patient Pickup<br/>at Partner Pharmacy"]
        Choice -->|Delivery| Delivery["Home Delivery"]

        Pickup --> Status5["PICKED_UP"]
        Delivery --> Status5
        Status5 --> Complete["COMPLETED"]
    end

    style TextractOCR fill:#e8daef
    style Complete fill:#c8e6c9
    style PharmacistReview fill:#ffe0b2
```

### Prescription Status State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PENDING_PAYMENT : Submit Order
    PENDING_PAYMENT --> PAYMENT_CONFIRMED : Payment Success
    PENDING_PAYMENT --> PAYMENT_FAILED : Payment Failed
    PAYMENT_FAILED --> PENDING_PAYMENT : Retry Payment
    PAYMENT_CONFIRMED --> PROCESSING : Begin Fulfillment
    PROCESSING --> READY_FOR_PICKUP : Items Packed
    READY_FOR_PICKUP --> OUT_FOR_DELIVERY : Dispatch
    READY_FOR_PICKUP --> PICKED_UP : Customer Pickup
    OUT_FOR_DELIVERY --> DELIVERED : Delivery Complete
    PICKED_UP --> COMPLETED : Confirm Receipt
    DELIVERED --> COMPLETED : Confirm Receipt

    PROCESSING --> CANCELLED : Cancel Order
    PENDING_PAYMENT --> CANCELLED : Cancel Order

    COMPLETED --> [*]
    CANCELLED --> [*]
```

---

## 8. WhatsApp Pharmacy Integration

```mermaid
flowchart TD
    subgraph Entry["Entry Points"]
        WA["WhatsApp Message<br/>Twilio/Gupshup Webhook"]
        WA --> Router["Message Router"]
    end

    subgraph StateMachine["Conversation State Machine"]
        Router --> CheckState{Current State?}

        CheckState -->|IDLE| Welcome["Send Welcome Message"]
        Welcome --> Verify["Request Phone Verification"]
        Verify --> VERIFICATION["VERIFICATION State"]

        VERIFICATION --> VerifyOTP["Verify OTP Code"]
        VerifyOTP --> Verified{Valid?}
        Verified -->|No| VERIFICATION
        Verified -->|Yes| MENU["MENU State"]

        MENU --> MenuChoice{User Choice}
        MenuChoice -->|Upload Rx| PRESCRIPTION_UPLOAD["PRESCRIPTION_UPLOAD State"]
        MenuChoice -->|Check Order| ORDER_STATUS["ORDER_STATUS State"]
        MenuChoice -->|Talk to Pharmacist| PHARMACIST_CHAT["PHARMACIST_CHAT State"]

        PRESCRIPTION_UPLOAD --> ReceiveImage["Receive Image"]
        ReceiveImage --> ProcessOCR["Process with Textract"]
        ProcessOCR --> ShowMeds["Display Extracted Medications"]
        ShowMeds --> Confirm{Confirm Order?}
        Confirm -->|Yes| ORDER_CREATION["ORDER_CREATION State"]
        Confirm -->|No| MENU

        ORDER_CREATION --> SelectPickup["Select Pickup Location"]
        SelectPickup --> CalculatePrice["Calculate Total"]
        CalculatePrice --> PaymentLink["Send Payment Link"]
        PaymentLink --> PAYMENT_PENDING["PAYMENT_PENDING State"]

        PAYMENT_PENDING --> PaymentComplete{Payment Done?}
        PaymentComplete -->|Yes| Confirmation["Send Order Confirmation"]
        PaymentComplete -->|No| PaymentReminder["Send Reminder"]
        PaymentReminder --> PAYMENT_PENDING

        Confirmation --> IDLE["Return to IDLE"]
    end

    subgraph HumanHandoff["Human Handoff System"]
        PHARMACIST_CHAT --> JoinQueue["Join Pharmacist Queue"]
        JoinQueue --> CheckAvailable{Pharmacist Available?}
        CheckAvailable -->|Yes| Connect["Connect to Pharmacist"]
        CheckAvailable -->|No| QueuePosition["Show Queue Position"]
        QueuePosition --> Wait["Wait with SLA Timer"]
        Wait --> Connect
        Connect --> LiveChat["Live Chat Session"]
        LiveChat --> EndChat["End Chat"]
        EndChat --> MENU
    end

    style ProcessOCR fill:#e8daef
    style IDLE fill:#c8e6c9
    style PHARMACIST_CHAT fill:#bbdefb
```

### WhatsApp State Diagram

```mermaid
stateDiagram-v2
    [*] --> IDLE

    IDLE --> VERIFICATION : New User
    VERIFICATION --> IDLE : Verification Failed
    VERIFICATION --> MENU : Verified

    MENU --> PRESCRIPTION_UPLOAD : Upload Prescription
    MENU --> ORDER_STATUS : Check Order
    MENU --> PHARMACIST_CHAT : Talk to Pharmacist
    MENU --> IDLE : Exit/Timeout

    PRESCRIPTION_UPLOAD --> OCR_PROCESSING : Image Received
    OCR_PROCESSING --> MEDICATION_CONFIRMATION : OCR Complete
    MEDICATION_CONFIRMATION --> ORDER_CREATION : Confirmed
    MEDICATION_CONFIRMATION --> MENU : Cancelled

    ORDER_CREATION --> PAYMENT_PENDING : Order Created
    PAYMENT_PENDING --> ORDER_CONFIRMED : Payment Success
    PAYMENT_PENDING --> MENU : Payment Timeout
    ORDER_CONFIRMED --> IDLE : Complete

    ORDER_STATUS --> MENU : Done

    PHARMACIST_CHAT --> QUEUE_WAITING : Join Queue
    QUEUE_WAITING --> ACTIVE_CHAT : Agent Connected
    ACTIVE_CHAT --> MENU : Chat Ended
```

---

## 9. Payment Processing Flow

```mermaid
flowchart TD
    subgraph Initialize["Payment Initialization"]
        Start([Start Payment]) --> SelectMethod{Payment Method}

        SelectMethod -->|Card| Card["Saved Card"]
        SelectMethod -->|Wallet| Wallet["Platform Wallet"]
        SelectMethod -->|New Card| NewCard["New Card Entry"]

        Card --> CheckBalance{Sufficient Balance?}
        Wallet --> CheckBalance
        NewCard --> Paystack["Paystack Checkout"]
    end

    subgraph Processing["Payment Processing"]
        CheckBalance -->|No| TopUp["Top Up Required"]
        TopUp --> Paystack
        CheckBalance -->|Yes| Deduct["Deduct from Balance"]

        Paystack --> Webhook["Paystack Webhook"]
        Webhook --> VerifySignature["Verify HMAC Signature"]
        VerifySignature --> VerifyPayment["Verify Payment Reference"]

        Deduct --> UpdateWallet["Update Wallet Balance"]
        VerifyPayment --> CreateTransaction["Create Transaction Record"]
        UpdateWallet --> CreateTransaction
    end

    subgraph PostPayment["Post-Payment Actions"]
        CreateTransaction --> Type{Transaction Type}

        Type -->|Appointment| BookAppointment["Confirm Appointment Booking"]
        Type -->|Prescription| ProcessOrder["Process Prescription Order"]
        Type -->|Subscription| ActivateSub["Activate Subscription"]
        Type -->|Consultation| ScheduleCall["Schedule Video Call"]

        BookAppointment --> Notify["Send Notifications"]
        ProcessOrder --> Notify
        ActivateSub --> Notify
        ScheduleCall --> Notify

        Notify --> Complete([Payment Complete])
    end

    style Start fill:#e3f2fd
    style Complete fill:#c8e6c9
    style Paystack fill:#fff9c4
```

---

## 10. Appointment Booking Flow

```mermaid
flowchart TD
    subgraph Selection["Appointment Selection"]
        Start([Book Appointment]) --> Channel{Select Channel}

        Channel -->|Video| Video["Video Consultation<br/>Zoom Integration"]
        Channel -->|Voice| Voice["Voice Call<br/>Twilio"]
        Channel -->|Chat| Chat["Text Chat<br/>In-App"]
        Channel -->|In-Person| InPerson["Physical Visit"]
        Channel -->|Home Visit| Home["Home Visit"]
        Channel -->|Emergency| Emergency["Emergency Response"]
    end

    subgraph Specialist["Specialist Selection"]
        Video --> SelectSpecialty["Select Specialty"]
        Voice --> SelectSpecialty
        Chat --> SelectSpecialty
        InPerson --> SelectSpecialty
        Home --> SelectSpecialty
        Emergency --> AutoAssign["Auto-Assign Available"]

        SelectSpecialty --> ViewAvailable["View Available Specialists"]
        ViewAvailable --> SelectDoctor["Select Specialist"]
        SelectDoctor --> SelectSlot["Select Time Slot"]
        AutoAssign --> SelectSlot
    end

    subgraph Booking["Booking Process"]
        SelectSlot --> CheckAvailability{Slot Available?}
        CheckAvailability -->|No| SelectSlot
        CheckAvailability -->|Yes| UploadDocs["Upload Documents<br/>(Optional)"]
        UploadDocs --> AddNotes["Add Notes/Symptoms"]
        AddNotes --> Review["Review Booking"]
        Review --> Payment["Process Payment"]
    end

    subgraph Confirmation["Confirmation"]
        Payment --> CreateAppointment["Create Appointment Record"]
        CreateAppointment --> NotifyPatient["Notify Patient"]
        CreateAppointment --> NotifyDoctor["Notify Specialist"]
        NotifyPatient --> AddCalendar["Add to Calendar"]
        NotifyDoctor --> AddCalendar

        AddCalendar --> Reminder["Schedule Reminders"]
        Reminder --> Complete([Appointment Booked])
    end

    subgraph VideoSetup["Video Consultation Setup"]
        Complete --> ApptTime{Appointment Time?}
        ApptTime -->|Now| CreateZoom["Create Zoom Meeting"]
        ApptTime -->|Later| ScheduleZoom["Schedule Zoom Meeting"]
        CreateZoom --> JoinLink["Generate Join Links"]
        ScheduleZoom --> JoinLink
    end

    style Start fill:#e3f2fd
    style Complete fill:#c8e6c9
    style Emergency fill:#ffcdd2
```

---

## 11. Database Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ HEALTH_CHECKUPS : "completes"
    USERS ||--o{ APPOINTMENTS : "books"
    USERS ||--o{ PRESCRIPTIONS : "receives"
    USERS ||--o{ VITALS : "records"
    USERS ||--o{ TRANSACTIONS : "makes"
    USERS ||--|| WALLETS : "has"
    USERS ||--o{ SUBSCRIPTIONS : "subscribes"
    USERS ||--o{ REFERRALS : "creates"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ HEALTH_SCORES : "has"

    SPECIALISTS ||--o{ APPOINTMENTS : "attends"
    SPECIALISTS ||--o{ PRESCRIPTIONS : "writes"
    SPECIALISTS ||--o{ CLINICAL_NOTES : "creates"

    APPOINTMENTS ||--o{ CLINICAL_NOTES : "generates"
    APPOINTMENTS ||--|| ZOOM_MEETINGS : "has"

    PRESCRIPTIONS ||--o{ PRESCRIPTION_ITEMS : "contains"
    PRESCRIPTIONS ||--|| PHARMACY_ORDERS : "creates"

    PHARMACY_ORDERS ||--o{ ORDER_ITEMS : "contains"
    PHARMACY_ORDERS ||--|| PICKUP_CENTERS : "assigned_to"

    MEDICATIONS ||--o{ PRESCRIPTION_ITEMS : "referenced_in"
    MEDICATIONS ||--o{ STOCK_ITEMS : "tracked_in"

    WHATSAPP_SESSIONS ||--|| USERS : "belongs_to"
    WHATSAPP_SESSIONS ||--o{ PHARMACY_ORDERS : "creates"

    USERS {
        ObjectId _id PK
        string email UK
        string password
        enum user_type
        enum status
        object profile
        boolean is_email_verified
        datetime last_login_at
        datetime created_at
    }

    HEALTH_CHECKUPS {
        ObjectId _id PK
        ObjectId user FK
        string health_check_for
        object patient_info
        object request
        object response
        datetime created_at
    }

    APPOINTMENTS {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId specialist FK
        enum channel
        enum status
        datetime scheduled_at
        string zoom_meeting_id
        datetime created_at
    }

    PRESCRIPTIONS {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId specialist FK
        enum source
        array medications
        enum status
        datetime created_at
    }

    VITALS {
        ObjectId _id PK
        ObjectId user FK
        string type
        number value
        string unit
        datetime recorded_at
    }

    HEALTH_SCORES {
        ObjectId _id PK
        ObjectId user FK
        number overall_score
        object domain_scores
        datetime calculated_at
    }

    WALLETS {
        ObjectId _id PK
        ObjectId user FK
        number balance
        string currency
        datetime updated_at
    }

    PHARMACY_ORDERS {
        ObjectId _id PK
        ObjectId prescription FK
        ObjectId pickup_center FK
        enum status
        number total_amount
        datetime created_at
    }

    WHATSAPP_SESSIONS {
        ObjectId _id PK
        ObjectId user FK
        string phone_number
        enum state
        object context
        datetime last_activity
    }
```

---

## 12. Security Architecture

```mermaid
flowchart TD
    subgraph ClientSecurity["Client-Side Security"]
        HTTPS["HTTPS Only<br/>TLS 1.3"]
        CSP["Content Security Policy"]
        XSS["XSS Protection"]
        CSRF["CSRF Tokens"]
    end

    subgraph EdgeSecurity["Edge Security"]
        CF["Cloudflare<br/>DDoS Protection"]
        WAF["Web Application Firewall"]
        RateLimit["Rate Limiting"]
    end

    subgraph APISecurity["API Security"]
        JWT["JWT Authentication"]
        Guards["NestJS Guards Chain"]

        subgraph GuardChain["Guard Chain"]
            G1["IsAuthorized<br/>Valid JWT"]
            G2["IsEmailVerified<br/>Confirmed Email"]
            G3["IsUserActive<br/>Not Suspended"]
            G4["RolesGuard<br/>RBAC Check"]
        end

        G1 --> G2
        G2 --> G3
        G3 --> G4
    end

    subgraph DataSecurity["Data Security"]
        Bcrypt["Bcrypt Password Hashing<br/>Cost Factor: 12"]
        Encryption["AES-256 Encryption<br/>Sensitive Data"]
        Sanitize["Input Sanitization<br/>Class Validator"]
    end

    subgraph AuthMethods["Authentication Methods"]
        Password["Email/Password"]
        OAuth["OAuth 2.0<br/>Google, Apple"]
        TwoFA["Two-Factor Auth<br/>TOTP, SMS, Email"]
    end

    subgraph Monitoring["Security Monitoring"]
        Logging["Audit Logging"]
        Alerts["Security Alerts"]
        Sessions["Session Management"]
    end

    ClientSecurity --> EdgeSecurity
    EdgeSecurity --> APISecurity
    APISecurity --> DataSecurity
    AuthMethods --> APISecurity
    APISecurity --> Monitoring

    style CF fill:#bbdefb
    style JWT fill:#c8e6c9
    style Bcrypt fill:#fff9c4
    style TwoFA fill:#e8daef
```

### RBAC Permission Matrix

```mermaid
graph LR
    subgraph Roles["User Roles"]
        Patient["Patient"]
        Specialist["Specialist"]
        Lifeguard["Lifeguard"]
        Admin["Administrator"]
    end

    subgraph Permissions["Key Permissions"]
        ViewOwn["View Own Data"]
        ViewPatients["View Patient Data"]
        CreateRx["Create Prescriptions"]
        ManageUsers["Manage Users"]
        ViewAnalytics["View Analytics"]
        SystemConfig["System Config"]
    end

    Patient --> ViewOwn

    Specialist --> ViewOwn
    Specialist --> ViewPatients
    Specialist --> CreateRx

    Lifeguard --> ViewOwn
    Lifeguard --> ViewPatients

    Admin --> ViewOwn
    Admin --> ViewPatients
    Admin --> CreateRx
    Admin --> ManageUsers
    Admin --> ViewAnalytics
    Admin --> SystemConfig

    style Admin fill:#fce4ec
    style Specialist fill:#e8f5e9
    style Patient fill:#e3f2fd
    style Lifeguard fill:#fff3e0
```

---

## 13. Deployment Architecture

```mermaid
flowchart TD
    subgraph Internet["Internet"]
        Users["Users"]
        Webhooks["External Webhooks<br/>Paystack, Twilio"]
    end

    subgraph Cloudflare["Cloudflare Edge"]
        DNS["DNS Resolution"]
        SSL["SSL Termination"]
        CDN["Static Asset CDN"]
        DDoS["DDoS Protection"]
    end

    subgraph Server["Production Server"]
        subgraph NGINX["NGINX Reverse Proxy"]
            LB["Load Balancer"]
            Routing["Route Configuration"]
        end

        subgraph PM2["PM2 Process Manager"]
            subgraph Frontend["Frontend Services"]
                PatientUI["RC-Frontend<br/>Port 3000"]
                AdminUI["RC-Admin-Frontend<br/>Port 8080"]
            end

            subgraph Backend["Backend Services"]
                PatientAPI["RC-Backend<br/>Port 5020"]
                AdminAPI["RC-Backend-Admin<br/>Port 5021"]
            end
        end
    end

    subgraph External["External Services"]
        MongoDB["MongoDB Atlas"]
        S3["AWS S3"]
        Redis["Redis Cloud"]
    end

    Users --> Cloudflare
    Webhooks --> Cloudflare
    Cloudflare --> NGINX
    NGINX --> PM2
    PM2 --> External

    style Cloudflare fill:#f8bbd9
    style PM2 fill:#c8e6c9
    style MongoDB fill:#fff9c4
```

### Service Configuration

```mermaid
graph TB
    subgraph Domains["Domain Configuration"]
        D1["rapidcapsule.com<br/>Patient Frontend"]
        D2["api.rapidcapsule.com<br/>Patient API"]
        D3["admin.rapidcapsule.com<br/>Admin Frontend"]
        D4["Internal:5021<br/>Admin API"]
    end

    subgraph Ports["Port Mapping"]
        P1["Port 3000<br/>Patient UI"]
        P2["Port 5020<br/>Patient Backend"]
        P3["Port 8080<br/>Admin UI"]
        P4["Port 5021<br/>Admin Backend"]
    end

    D1 --> P1
    D2 --> P2
    D3 --> P3
    D4 --> P4
```

---

## 14. Technology Stack

```mermaid
mindmap
    root((Rapid Capsule<br/>Tech Stack))
        Frontend
            Vue.js 3
                Composition API
                Vue Router
                Vuex State
            Vuetify 3
                Material Design
            Pinia
                Admin State
            PWA
                Service Workers
        Backend
            NestJS 9
                TypeScript
                Modules
                Guards
            Mongoose
                MongoDB ODM
                Schemas
            Passport.js
                JWT Strategy
                OAuth
            Socket.io
                WebSockets
        Database
            MongoDB
                Document Store
                Aggregation
            Redis
                Caching
                Sessions
            AWS S3
                File Storage
                Images
        AI Services
            Infermedica
                Symptom Analysis
                Triage
            Claude AI
                Health Summaries
                Vision OCR
            AWS Textract
                Document OCR
        Integrations
            Zoom
                Video Calls
            Paystack
                Payments
            Twilio
                SMS
                WhatsApp
            Brevo
                Email
```

---

## Innovation Highlights for Global Talent Visa

```mermaid
graph TB
    subgraph Innovation["🏆 Key Innovations"]
        I1["AI-Powered Diagnostics<br/>Infermedica Integration"]
        I2["LLM Health Summaries<br/>Claude AI"]
        I3["6-Domain Health Scoring<br/>Digital Health Twin"]
        I4["WhatsApp Conversational Commerce<br/>Emerging Market Access"]
        I5["5-Level OCR Pipeline<br/>AWS Textract"]
        I6["Multi-Channel Telemedicine<br/>6 Consultation Types"]
    end

    subgraph Impact["💡 Healthcare Impact"]
        I1 --> H1["Democratizes Medical AI"]
        I2 --> H2["Patient-Friendly Explanations"]
        I3 --> H3["Longitudinal Health Tracking"]
        I4 --> H4["Healthcare Access for Underserved"]
        I5 --> H5["Prescription Digitization"]
        I6 --> H6["Flexible Care Delivery"]
    end

    subgraph Technical["⚙️ Technical Complexity"]
        I1 --> T1["Real-time Interview Engine"]
        I2 --> T2["Multi-Source Analysis"]
        I3 --> T3["Weighted Algorithm Design"]
        I4 --> T4["State Machine Architecture"]
        I5 --> T5["Fallback Strategy Pattern"]
        I6 --> T6["Unified Booking System"]
    end

    style I1 fill:#e8daef
    style I2 fill:#e8daef
    style I3 fill:#e8daef
    style I4 fill:#bbdefb
    style I5 fill:#c8e6c9
    style I6 fill:#fff9c4
```

---

## Document Information

| Property | Value |
|----------|-------|
| **Version** | 2.0.0 |
| **Last Updated** | January 2026 |
| **Format** | Mermaid Markdown |
| **Compatibility** | GitHub, GitLab, Notion, VS Code |
| **Purpose** | Global Talent Visa Documentation |

---

*Generated for Rapid Capsule Telemedicine Platform - UK Global Talent Visa Application*
