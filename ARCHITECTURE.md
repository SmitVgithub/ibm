# System Architecture Document

## Project Overview
**Repository:** SmitVgithub/ibm
**Language:** nodejs
**Request:** Create a taxi driver application with a real-time ride sharing.

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        MA["Mobile App"]
        WA["Web App"]
    end

    subgraph Gateway["Gateway Layer"]
        AG["API Gateway\n(Auth, Rate Limiting, Routing)"]
    end

    subgraph Services["Microservices Layer"]
        AUTH["Authentication Service"]
        DS["Driver Service"]
        PS["Passenger Service"]
        RS["Ride Service"]
        RMS["Ride Matching Service"]
        LTS["Location Tracking Service"]
        NS["Notification Service"]
        PAY["Payment Service"]
    end

    subgraph DataLayer["Data Layer"]
        UDB[("User Database")]
        RDB[("Ride Database")]
        GDB[("Geospatial Database")]
        PDB[("Payment Database")]
        RC[("Redis Cache")]
        EQ["Event Queue"]
        OS[("Object Storage")]
    end

    MA & WA -->|"HTTP/WebSocket"| AG
    AG -->|"Auth Requests"| AUTH
    AG -->|"Driver APIs"| DS
    AG -->|"Passenger APIs"| PS
    AG -->|"Ride APIs"| RS
    AG -->|"WebSocket"| LTS

    AUTH -->|"User Data"| UDB
    AUTH -->|"Sessions"| RC
    DS -->|"Driver Profiles"| UDB
    DS -->|"Documents"| OS
    PS -->|"Passenger Profiles"| UDB
    RS -->|"Ride Records"| RDB
    RS -->|"Match Request"| RMS
    RS -->|"Events"| EQ
    RMS -->|"Location Query"| GDB
    RMS -->|"Driver Cache"| RC
    LTS -->|"Live Positions"| GDB
    LTS -->|"Position Cache"| RC
    EQ -->|"Notifications"| NS
    EQ -->|"Payment Events"| PAY
    PAY -->|"Transactions"| PDB
```

### Request Flow

```mermaid
sequenceDiagram
    autonumber
    participant P as Passenger App
    participant AG as API Gateway
    participant AUTH as Auth Service
    participant RS as Ride Service
    participant RMS as Matching Service
    participant LTS as Location Service
    participant D as Driver App
    participant NS as Notification Service
    participant PAY as Payment Service

    Note over P,PAY: User Authentication Flow
    P->>AG: Login Request
    AG->>AUTH: Validate Credentials
    activate AUTH
    AUTH-->>AG: JWT Token
    deactivate AUTH
    AG-->>P: Auth Success + Token

    Note over P,PAY: Ride Request Flow
    P->>AG: Request Ride (pickup, destination)
    AG->>RS: Create Ride Request
    activate RS
    RS->>RMS: Find Available Drivers
    activate RMS
    RMS->>LTS: Query Nearby Drivers
    LTS-->>RMS: Driver Locations
    RMS-->>RS: Matched Driver
    deactivate RMS
    RS->>NS: Notify Driver
    NS-->>D: Push Notification
    RS-->>AG: Ride Created
    deactivate RS
    AG-->>P: Ride Confirmed

    Note over P,PAY: Real-time Tracking Flow
    D->>LTS: WebSocket Connect
    activate LTS
    loop Every 5 seconds
        D->>LTS: Update Location
        LTS-->>P: Driver Position Update
    end
    deactivate LTS

    Note over P,PAY: Ride Completion & Payment
    D->>AG: Complete Ride
    AG->>RS: Update Ride Status
    RS->>PAY: Process Payment
    activate PAY
    PAY-->>RS: Payment Confirmed
    deactivate PAY
    RS->>NS: Send Receipt
    NS-->>P: Ride Receipt
    NS-->>D: Earnings Update
```

### Database Schema

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string phone UK
        string password_hash
        enum role "driver,passenger"
        timestamp created_at
        boolean is_active
    }

    DRIVER_PROFILE {
        uuid id PK
        uuid user_id FK
        string license_number
        string vehicle_make
        string vehicle_model
        string vehicle_plate
        float rating
        decimal earnings_balance
        enum status "online,offline,busy"
    }

    PASSENGER_PROFILE {
        uuid id PK
        uuid user_id FK
        string default_payment_method
        json saved_locations
        json preferences
    }

    RIDE {
        uuid id PK
        uuid passenger_id FK
        uuid driver_id FK
        uuid shared_ride_group_id FK
        point pickup_location
        point dropoff_location
        enum status "requested,matched,in_progress,completed,cancelled"
        decimal fare_amount
        decimal distance_km
        timestamp requested_at
        timestamp completed_at
    }

    SHARED_RIDE_GROUP {
        uuid id PK
        json route_waypoints
        int max_passengers
        int current_passengers
        enum status "forming,active,completed"
    }

    PAYMENT {
        uuid id PK
        uuid ride_id FK
        uuid passenger_id FK
        decimal amount
        decimal split_amount
        enum status "pending,completed,refunded"
        string transaction_ref
        timestamp processed_at
    }

    DRIVER_LOCATION {
        uuid id PK
        uuid driver_id FK
        point current_location
        float heading
        float speed
        timestamp updated_at
    }

    NOTIFICATION {
        uuid id PK
        uuid user_id FK
        string title
        string message
        enum type "push,sms,in_app"
        boolean is_read
        timestamp sent_at
    }

    USER ||--o| DRIVER_PROFILE : "has"
    USER ||--o| PASSENGER_PROFILE : "has"
    USER ||--o{ NOTIFICATION : "receives"
    DRIVER_PROFILE ||--o{ RIDE : "drives"
    DRIVER_PROFILE ||--|| DRIVER_LOCATION : "has"
    PASSENGER_PROFILE ||--o{ RIDE : "requests"
    RIDE ||--o{ PAYMENT : "has"
    RIDE }o--o| SHARED_RIDE_GROUP : "belongs to"
    PASSENGER_PROFILE ||--o{ PAYMENT : "makes"
```

### Deployment Architecture

```mermaid
flowchart LR
    subgraph Internet["Internet"]
        Users["Mobile & Web Users"]
    end

    subgraph CDN["CDN Layer"]
        CF["CloudFront CDN"]
    end

    subgraph VPC["AWS VPC"]
        subgraph PublicSubnet["Public Subnet"]
            ALB["Application Load Balancer"]
            NLB["Network Load Balancer\n(WebSocket)"]
        end

        subgraph EKS["EKS Kubernetes Cluster"]
            subgraph GatewayPod["Gateway Pods"]
                AGW1["API Gateway\nReplica 1"]
                AGW2["API Gateway\nReplica 2"]
            end

            subgraph ServicePods["Service Pods"]
                AUTH_POD["Auth Service\nx2 replicas"]
                DRIVER_POD["Driver Service\nx2 replicas"]
                PASS_POD["Passenger Service\nx2 replicas"]
                RIDE_POD["Ride Service\nx3 replicas"]
                MATCH_POD["Matching Service\nx2 replicas"]
                LOC_POD["Location Service\nx4 replicas"]
                NOTIF_POD["Notification Service\nx2 replicas"]
                PAY_POD["Payment Service\nx2 replicas"]
            end
        end

        subgraph DataSubnet["Private Data Subnet"]
            subgraph RDS["Amazon RDS"]
                PG_PRIMARY[("PostgreSQL Primary\nUser & Ride DB")]
                PG_REPLICA[("PostgreSQL Replica")]
            end

            POSTGIS[("PostGIS\nGeospatial DB")]

            subgraph ElastiCache["ElastiCache"]
                REDIS_PRIMARY[("Redis Primary")]
                REDIS_REPLICA[("Redis Replica")]
            end

            SQS["Amazon SQS\nEvent Queue"]
            S3[("S3 Bucket\nObject Storage")]
        end
    end

    subgraph External["External Services"]
        STRIPE["Stripe\nPayments"]
        FCM["Firebase FCM\nPush Notifications"]
        TWILIO["Twilio\nSMS"]
    end

    Users -->|"HTTPS"| CF
    CF -->|"Static Assets"| S3
    CF -->|"API Requests"| ALB
    Users -->|"WebSocket"| NLB
    ALB --> AGW1 & AGW2
    NLB --> LOC_POD
    AGW1 & AGW2 --> AUTH_POD & DRIVER_POD & PASS_POD & RIDE_POD
    RIDE_POD --> MATCH_POD
    MATCH_POD --> LOC_POD
    AUTH_POD & DRIVER_POD & PASS_POD --> PG_PRIMARY
    RIDE_POD --> PG_PRIMARY
    LOC_POD & MATCH_POD --> POSTGIS
    AUTH_POD & LOC_POD --> REDIS_PRIMARY
    RIDE_POD & NOTIF_POD --> SQS
    PAY_POD --> STRIPE
    NOTIF_POD --> FCM & TWILIO
    PG_PRIMARY -.->|"Replication"| PG_REPLICA
    REDIS_PRIMARY -.->|"Replication"| REDIS_REPLICA
```

## Architecture Narrative

Build a real-time taxi driver application with ride-sharing capabilities. The system enables drivers to receive and manage ride requests, passengers to book rides and share them with others heading in similar directions, and provides real-time location tracking, fare splitting, and route optimization. The architecture leverages WebSocket connections for real-time updates, a geospatial database for location-based matching, and a message queue for reliable event processing. Given the existing repository has Node.js tooling and Docker support, we'll build on that foundation with a microservices approach suitable for scaling ride-sharing operations.

## Components

- **API Gateway** (gateway): Central entry point handling authentication, rate limiting, and request routing to microservices. Manages WebSocket upgrade requests for real-time features.
- **Authentication Service** (service): Handles user registration, login, token management, and role-based access control for drivers and passengers.
- **Driver Service** (service): Manages driver profiles, availability status, vehicle information, ratings, and earnings tracking.
- **Passenger Service** (service): Manages passenger profiles, ride history, saved locations, payment methods, and preferences.
- **Ride Service** (service): Core ride management handling ride creation, status updates, fare calculation, and ride-sharing coordination including fare splitting.
- **Ride Matching Service** (service): Intelligent matching engine that pairs passengers with drivers and identifies ride-sharing opportunities based on route similarity, timing, and preferences.
- **Location Tracking Service** (service): Real-time location tracking service handling WebSocket connections for live driver positions, ETA updates, and trip progress.
- **Notification Service** (service): Handles push notifications, SMS alerts, and in-app notifications for ride updates, promotions, and system messages.
- **Payment Service** (service): Processes payments, handles fare splitting for shared rides, manages refunds, and driver payouts.
- **User Database** (database): Primary database for user accounts, driver profiles, passenger profiles, and authentication data.
- **Ride Database** (database): Stores ride records, trip history, fare calculations, and ride-sharing group information.
- **Geospatial Database** (database): Specialized geospatial database for real-time driver locations, geofencing, and spatial queries for ride matching.
- **Payment Database** (database): Secure storage for payment transactions, wallet balances, and financial records with audit logging.
- **Redis Cache** (cache): In-memory cache for session management, real-time driver locations, rate limiting, and Socket.io adapter for horizontal scaling.
- **Event Queue** (queue): Message broker for async event processing including ride events, notifications, and payment processing.
- **Object Storage** (storage): Stores driver documents, profile images, and ride receipts.

---
*Generated by Blueprint Brain 1.7*
