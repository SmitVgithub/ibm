# System Architecture Document

## Project Overview
**Repository:** SmitVgithub/ibm
**Language:** nodejs
**Request:** Answer:
1. No preference - recommend the best option
2. Fixed time slots predefined in the system
3. Pay per session (basic - $19 for 1 hours session, Pro $35 - 1 week and custom - contact support)
4. Phone OTP only

Only one user type - patients (book appointments).

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer"]
        WEB["Web Application\n(React/Next.js)"]
        MOBILE["Mobile App\n(React Native)"]
    end
    
    subgraph Backend["Backend Layer"]
        API["API Gateway"]
        AUTH["Auth Service\n(Phone OTP)"]
        BOOKING["Booking Service"]
        PAYMENT["Payment Service"]
        NOTIFY["Notification Service"]
        SLOT["Time Slot Manager"]
    end
    
    subgraph Data["Data Layer"]
        DB[("PostgreSQL\nDatabase")]
        CACHE[("Redis Cache")]
        QUEUE["Message Queue"]
    end
    
    subgraph External["External Services"]
        SMS["SMS Gateway\n(Twilio)"]
        PAY_GW["Payment Gateway\n(Stripe)"]
    end
    
    WEB --> API
    MOBILE --> API
    API --> AUTH
    API --> BOOKING
    API --> PAYMENT
    AUTH --> SMS
    AUTH --> CACHE
    BOOKING --> SLOT
    BOOKING --> DB
    SLOT --> DB
    SLOT --> CACHE
    PAYMENT --> PAY_GW
    PAYMENT --> DB
    NOTIFY --> QUEUE
    QUEUE --> SMS
    BOOKING --> NOTIFY
```

### Request Flow

```mermaid
sequenceDiagram
    participant P as Patient
    participant APP as Web/Mobile App
    participant API as API Gateway
    participant AUTH as Auth Service
    participant SMS as SMS Gateway
    participant SLOT as Slot Manager
    participant BOOK as Booking Service
    participant PAY as Payment Service
    participant DB as Database
    
    Note over P,DB: Phone OTP Authentication Flow
    P->>APP: Enter phone number
    APP->>API: Request OTP
    API->>AUTH: Generate OTP
    activate AUTH
    AUTH->>SMS: Send OTP
    SMS-->>P: OTP via SMS
    AUTH-->>API: OTP sent confirmation
    deactivate AUTH
    API-->>APP: Show OTP input
    P->>APP: Enter OTP
    APP->>API: Verify OTP
    API->>AUTH: Validate OTP
    AUTH-->>API: JWT Token
    API-->>APP: Authentication success
    
    Note over P,DB: Appointment Booking Flow
    P->>APP: View available slots
    APP->>API: GET /slots
    API->>SLOT: Fetch available slots
    SLOT->>DB: Query time slots
    DB-->>SLOT: Available slots
    SLOT-->>API: Slot list
    API-->>APP: Display slots
    P->>APP: Select slot & plan
    APP->>API: POST /bookings
    API->>BOOK: Create booking
    activate BOOK
    BOOK->>SLOT: Reserve slot
    BOOK->>PAY: Process payment
    activate PAY
    PAY-->>BOOK: Payment confirmed
    deactivate PAY
    BOOK->>DB: Save booking
    BOOK-->>API: Booking confirmed
    deactivate BOOK
    API-->>APP: Show confirmation
    APP-->>P: Booking success
```

### Database Schema

```mermaid
erDiagram
    PATIENT {
        uuid id PK
        string phone_number UK
        string name
        string email
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    
    TIME_SLOT {
        uuid id PK
        date slot_date
        time start_time
        time end_time
        string status
        int max_capacity
        int current_bookings
        timestamp created_at
    }
    
    BOOKING {
        uuid id PK
        uuid patient_id FK
        uuid time_slot_id FK
        uuid payment_id FK
        string status
        string booking_reference
        timestamp booked_at
        timestamp cancelled_at
    }
    
    PAYMENT {
        uuid id PK
        uuid patient_id FK
        string plan_type
        decimal amount
        string currency
        string payment_status
        string transaction_id
        timestamp paid_at
        timestamp expires_at
    }
    
    PRICING_PLAN {
        uuid id PK
        string name
        string plan_code
        decimal price
        int duration_hours
        string description
        boolean is_active
    }
    
    OTP_VERIFICATION {
        uuid id PK
        string phone_number
        string otp_code
        timestamp expires_at
        boolean is_verified
        int attempts
        timestamp created_at
    }
    
    NOTIFICATION {
        uuid id PK
        uuid patient_id FK
        uuid booking_id FK
        string type
        string channel
        string status
        text message
        timestamp sent_at
    }
    
    PATIENT ||--o{ BOOKING : makes
    PATIENT ||--o{ PAYMENT : has
    PATIENT ||--o{ NOTIFICATION : receives
    TIME_SLOT ||--o{ BOOKING : contains
    PAYMENT ||--|| BOOKING : covers
    PRICING_PLAN ||--o{ PAYMENT : defines
    BOOKING ||--o{ NOTIFICATION : triggers
```

### Deployment Architecture

```mermaid
flowchart LR
    subgraph Internet["Internet"]
        USER["👤 Patients"]
    end
    
    subgraph CDN["CDN Layer"]
        CF["CloudFlare CDN"]
    end
    
    subgraph Cloud["IBM Cloud / AWS"]
        subgraph DMZ["Public Subnet"]
            LB["Load Balancer\n(ALB)"]
            WAF["Web Application\nFirewall"]
        end
        
        subgraph AppTier["Application Subnet"]
            subgraph K8S["Kubernetes Cluster"]
                API1["API Gateway\nPod 1"]
                API2["API Gateway\nPod 2"]
                AUTH1["Auth Service\nPod"]
                BOOK1["Booking Service\nPod"]
                PAY1["Payment Service\nPod"]
                NOTIFY1["Notification\nService Pod"]
            end
        end
        
        subgraph DataTier["Private Subnet"]
            subgraph DBCluster["Database Cluster"]
                PGMASTER[("PostgreSQL\nPrimary")]
                PGREPLICA[("PostgreSQL\nReplica")]
            end
            REDIS[("Redis Cluster\n(ElastiCache)")]
            SQS["Message Queue\n(SQS/RabbitMQ)"]
        end
        
        subgraph Storage["Storage"]
            S3["Object Storage\n(S3/COS)"]
        end
    end
    
    subgraph ExtServices["External Services"]
        TWILIO["Twilio\nSMS API"]
        STRIPE["Stripe\nPayment API"]
    end
    
    USER --> CF
    CF --> WAF
    WAF --> LB
    LB --> API1
    LB --> API2
    API1 --> AUTH1
    API1 --> BOOK1
    API2 --> AUTH1
    API2 --> BOOK1
    AUTH1 --> REDIS
    BOOK1 --> PAY1
    BOOK1 --> NOTIFY1
    AUTH1 --> PGMASTER
    BOOK1 --> PGMASTER
    PAY1 --> PGMASTER
    PGMASTER --> PGREPLICA
    NOTIFY1 --> SQS
    AUTH1 --> TWILIO
    PAY1 --> STRIPE
    NOTIFY1 --> TWILIO
```

## Architecture Narrative

Answer:
1. No preference - recommend the best option
2. Fixed time slots predefined in the system
3. Pay per session (basic - $19 for 1 hours session, Pro $35 - 1 week and custom - contact support)
4. Phone OTP only

Only one user type - patients (book appointments).


---
*Generated by Blueprint Brain 1.7*
