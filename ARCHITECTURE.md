# System Architecture Document

## Project Overview
**Repository:** SmitVgithub/ibm
**Language:** nodejs
**Request:** Build a real-time fleet management system called "TrackFleet" for a logistics company. It needs a web dashboard for dispatchers, an Android-only driver app with offline GPS tracking, and an iOS iPad app for warehouse managers. Integrate with Twilio for SMS alerts, Mapbox for live maps, and Stripe for invoice payments. Expected 500 drivers, 50 dispatchers, 10 warehouses. Budget under $300/month.

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Applications"]
        WEB["Web Dashboard\n(Dispatchers - 50 users)"]
        ANDROID["Android Driver App\n(500 drivers)\nOffline GPS Tracking"]
        IPAD["iOS iPad App\n(Warehouse Managers - 10)"]
    end

    subgraph Backend["Backend Services"]
        API["TrackFleet API Server\n(Node.js/Express)"]
        WS["WebSocket Server\n(Real-time Updates)"]
        QUEUE["Message Queue\n(Redis)"]
        WORKER["Background Workers\n(GPS Processing, Alerts)"]
    end

    subgraph Data["Data Layer"]
        DB[("PostgreSQL\nMain Database")]
        CACHE[("Redis Cache\nSession & GPS Buffer")]
        STORAGE[("Object Storage\nDocuments & Images")]
    end

    subgraph External["External Services"]
        TWILIO["Twilio\nSMS Alerts"]
        MAPBOX["Mapbox\nLive Maps & Routing"]
        STRIPE["Stripe\nInvoice Payments"]
    end

    WEB -->|"HTTPS"| API
    WEB -->|"WSS"| WS
    ANDROID -->|"HTTPS + Sync"| API
    ANDROID -->|"WSS"| WS
    IPAD -->|"HTTPS"| API
    IPAD -->|"WSS"| WS

    API -->|"Read/Write"| DB
    API -->|"Cache"| CACHE
    API -->|"Files"| STORAGE
    API -->|"Publish"| QUEUE

    WS -->|"Subscribe"| CACHE
    WORKER -->|"Consume"| QUEUE
    WORKER -->|"Update"| DB
    WORKER -->|"Send SMS"| TWILIO

    API -->|"Geocoding"| MAPBOX
    API -->|"Payments"| STRIPE
    WEB -->|"Map Tiles"| MAPBOX
```

### Request Flow

```mermaid
sequenceDiagram
    autonumber
    participant D as Android Driver App
    participant API as TrackFleet API
    participant WS as WebSocket Server
    participant DB as PostgreSQL
    participant Q as Redis Queue
    participant W as Worker
    participant T as Twilio
    participant WEB as Dispatcher Dashboard

    Note over D,WEB: Flow 1: Driver GPS Update with Offline Sync
    D->>D: Collect GPS points offline
    activate D
    D->>API: POST /api/gps/batch (synced points)
    deactivate D
    activate API
    API->>DB: Store GPS locations
    API->>Q: Publish location update
    API-->>D: 200 OK (sync confirmed)
    deactivate API
    activate W
    W->>Q: Consume location event
    W->>WS: Broadcast to subscribers
    deactivate W
    WS-->>WEB: Real-time driver position

    Note over WEB,T: Flow 2: Dispatcher Creates Delivery Alert
    WEB->>API: POST /api/deliveries/{id}/alert
    activate API
    API->>DB: Log alert request
    API->>Q: Queue SMS notification
    API-->>WEB: 202 Accepted
    deactivate API
    activate W
    W->>Q: Consume SMS job
    W->>T: Send SMS to driver
    T-->>W: SMS delivered
    W->>DB: Update notification status
    deactivate W

    Note over D,DB: Flow 3: Warehouse Manager Views Inventory
    participant iPad as iPad Warehouse App
    iPad->>API: GET /api/warehouses/{id}/inventory
    activate API
    API->>DB: Query inventory data
    DB-->>API: Inventory records
    API-->>iPad: 200 OK (inventory list)
    deactivate API
    iPad->>API: PUT /api/inventory/{id}/receive
    activate API
    API->>DB: Update stock levels
    API->>WS: Notify dispatchers
    API-->>iPad: 200 OK
    deactivate API
```

### Database Schema

```mermaid
erDiagram
    USER ||--o{ DRIVER : "is a"
    USER ||--o{ DISPATCHER : "is a"
    USER ||--o{ WAREHOUSE_MANAGER : "is a"
    USER {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        enum role
        timestamp created_at
        boolean is_active
    }

    DRIVER ||--o{ GPS_LOCATION : "reports"
    DRIVER ||--o{ DELIVERY : "assigned to"
    DRIVER {
        uuid id PK
        uuid user_id FK
        string phone_number
        string license_number
        uuid current_vehicle_id FK
        enum status
    }

    DISPATCHER ||--o{ DELIVERY : "creates"
    DISPATCHER {
        uuid id PK
        uuid user_id FK
        string employee_id
    }

    WAREHOUSE_MANAGER ||--|| WAREHOUSE : "manages"
    WAREHOUSE_MANAGER {
        uuid id PK
        uuid user_id FK
        uuid warehouse_id FK
    }

    VEHICLE ||--o{ DRIVER : "assigned to"
    VEHICLE ||--o{ GPS_LOCATION : "tracked by"
    VEHICLE {
        uuid id PK
        string plate_number UK
        string model
        integer year
        enum status
        date last_maintenance
    }

    GPS_LOCATION {
        uuid id PK
        uuid driver_id FK
        uuid vehicle_id FK
        decimal latitude
        decimal longitude
        float speed
        float heading
        timestamp recorded_at
        boolean synced_offline
    }

    WAREHOUSE ||--o{ INVENTORY : "contains"
    WAREHOUSE ||--o{ DELIVERY : "origin or destination"
    WAREHOUSE {
        uuid id PK
        string name
        string address
        decimal latitude
        decimal longitude
        string contact_phone
    }

    DELIVERY ||--o{ DELIVERY_ITEM : "contains"
    DELIVERY ||--o{ NOTIFICATION : "triggers"
    DELIVERY {
        uuid id PK
        uuid driver_id FK
        uuid dispatcher_id FK
        uuid origin_warehouse_id FK
        string destination_address
        decimal dest_latitude
        decimal dest_longitude
        enum status
        timestamp scheduled_at
        timestamp completed_at
    }

    DELIVERY_ITEM {
        uuid id PK
        uuid delivery_id FK
        uuid inventory_id FK
        integer quantity
    }

    INVENTORY {
        uuid id PK
        uuid warehouse_id FK
        string sku
        string name
        integer quantity
        timestamp last_updated
    }

    NOTIFICATION {
        uuid id PK
        uuid delivery_id FK
        uuid user_id FK
        enum channel
        string message
        enum status
        timestamp sent_at
    }

    INVOICE ||--o{ INVOICE_LINE : "contains"
    INVOICE {
        uuid id PK
        string stripe_invoice_id
        uuid customer_id
        decimal total_amount
        enum status
        timestamp created_at
        timestamp paid_at
    }

    INVOICE_LINE {
        uuid id PK
        uuid invoice_id FK
        uuid delivery_id FK
        string description
        decimal amount
    }
```

### Deployment Architecture

```mermaid
flowchart LR
    subgraph ClientDeploy["Client Distribution"]
        PLAYSTORE["Google Play Store\n(Android Driver App)"]
        APPSTORE["Apple App Store\n(iOS iPad App)"]
        CDN["Cloudflare CDN\n(Web Dashboard SPA)"]
    end

    subgraph Cloud["Cloud Infrastructure - Railway/Render (~$50/mo)"]
        subgraph WebTier["Web Tier"]
            LB["Load Balancer\n(Built-in)"]
            API1["API Server 1\n(Node.js)"]
            API2["API Server 2\n(Node.js)"]
            WSSERVER["WebSocket Server\n(Socket.io)"]
        end

        subgraph WorkerTier["Worker Tier"]
            BGWORKER["Background Worker\n(GPS + Notifications)"]
        end

        subgraph DataTier["Data Tier (~$30/mo)"]
            POSTGRES[("PostgreSQL\nSupabase Free/Pro")]
            REDIS[("Redis\nUpstash Free Tier")]
            S3[("Object Storage\nCloudflare R2 Free")]
        end
    end

    subgraph ExternalServices["External Services (~$100/mo)"]
        TWILIOSVC["Twilio\nSMS API\n(~$50/mo est.)"]
        MAPBOXSVC["Mapbox\nMaps API\n(Free tier 50k loads)"]
        STRIPESVC["Stripe\nPayments\n(2.9% + 30¢/txn)"]
    end

    subgraph Monitoring["Monitoring (Free Tier)"]
        SENTRY["Sentry\nError Tracking"]
        LOGS["Logtail\nLog Management"]
    end

    PLAYSTORE -.->|"500 Drivers"| LB
    APPSTORE -.->|"10 Warehouses"| LB
    CDN -->|"50 Dispatchers"| LB

    LB --> API1
    LB --> API2
    LB --> WSSERVER

    API1 --> POSTGRES
    API2 --> POSTGRES
    API1 --> REDIS
    API2 --> REDIS
    WSSERVER --> REDIS

    API1 --> S3
    API2 --> S3

    REDIS --> BGWORKER
    BGWORKER --> POSTGRES
    BGWORKER --> TWILIOSVC

    API1 --> MAPBOXSVC
    API2 --> MAPBOXSVC
    API1 --> STRIPESVC
    API2 --> STRIPESVC

    API1 -.-> SENTRY
    API2 -.-> SENTRY
    BGWORKER -.-> LOGS
```

## Architecture Narrative

Build a real-time fleet management system called "TrackFleet" for a logistics company. It needs a web dashboard for dispatchers, an Android-only driver app with offline GPS tracking, and an iOS iPad app for warehouse managers. Integrate with Twilio for SMS alerts, Mapbox for live maps, and Stripe for invoice payments. Expected 500 drivers, 50 dispatchers, 10 warehouses. Budget under $300/month.


---
*Generated by Blueprint Brain 1.7*
