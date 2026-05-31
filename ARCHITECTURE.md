# System Architecture Document

## Project Overview
**Repository:** SmitVgithub/ibm
**Language:** nodejs
**Request:** Design a real-time sports betting platform called "BetStream" for the Indian market. It must handle 100,000 concurrent users during IPL matches, process bets within 200ms, integrate with live score feeds via WebSocket, support UPI and Paytm payments, comply with state-level gambling regulations, and provide a web-based admin panel plus Android and iOS apps for bettors. Need multi-region deployment (Mumbai + Singapore) with automatic failover.

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Applications"]
        iOS["iOS App\n(Swift)"]
        Android["Android App\n(Kotlin)"]
        AdminWeb["Admin Panel\n(Web Dashboard)"]
    end

    subgraph CDN["Content Delivery"]
        CloudFront["AWS CloudFront\nCDN"]
    end

    subgraph LoadBalancing["Load Balancing Layer"]
        ALB_Mumbai["ALB Mumbai"]
        ALB_Singapore["ALB Singapore"]
        GlobalLB["Route 53\nGeo DNS"]
    end

    subgraph Backend["Backend Services - Mumbai"]
        APIGateway["API Gateway\n(Kong)"]
        AuthService["Auth Service\n(JWT + OTP)"]
        BetEngine["Bet Processing Engine\n(<200ms SLA)"]
        OddsService["Odds Calculation\nService"]
        WalletService["Wallet Service"]
        NotificationService["Push Notification\nService"]
        ComplianceService["Compliance Service\n(State Regulations)"]
        AdminAPI["Admin API\nService"]
    end

    subgraph RealTime["Real-Time Layer"]
        WSGateway["WebSocket Gateway\n(Socket.io)"]
        RedisCluster["Redis Cluster\n(Pub/Sub + Cache)"]
        KafkaCluster["Apache Kafka\n(Event Streaming)"]
    end

    subgraph DataLayer["Data Layer"]
        PostgresMain["PostgreSQL Primary\n(Transactions)"]
        PostgresReplica["PostgreSQL Replica\n(Read)"]
        MongoDB["MongoDB\n(Bet History)"]
        ElasticSearch["ElasticSearch\n(Analytics)"]
    end

    subgraph External["External Integrations"]
        LiveScoreFeed["Live Score API\n(WebSocket Feed)"]
        UPI["UPI Gateway\n(NPCI)"]
        Paytm["Paytm Payment\nGateway"]
        SMS["SMS Gateway\n(MSG91)"]
        Firebase["Firebase\nFCM"]
    end

    iOS --> GlobalLB
    Android --> GlobalLB
    AdminWeb --> CloudFront
    CloudFront --> ALB_Mumbai
    GlobalLB --> ALB_Mumbai
    GlobalLB --> ALB_Singapore
    ALB_Mumbai --> APIGateway
    APIGateway --> AuthService
    APIGateway --> BetEngine
    APIGateway --> OddsService
    APIGateway --> WalletService
    APIGateway --> AdminAPI
    BetEngine --> KafkaCluster
    BetEngine --> RedisCluster
    OddsService --> RedisCluster
    WalletService --> PostgresMain
    WalletService --> UPI
    WalletService --> Paytm
    WSGateway --> RedisCluster
    LiveScoreFeed --> WSGateway
    NotificationService --> Firebase
    NotificationService --> SMS
    ComplianceService --> PostgresMain
    KafkaCluster --> MongoDB
    KafkaCluster --> ElasticSearch
    PostgresMain --> PostgresReplica
```

### Request Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as Mobile App
    participant GW as API Gateway
    participant Auth as Auth Service
    participant Bet as Bet Engine
    participant Odds as Odds Service
    participant Wallet as Wallet Service
    participant WS as WebSocket Gateway
    participant Redis as Redis Cache
    participant Kafka as Kafka
    participant DB as PostgreSQL
    participant UPI as UPI Gateway
    participant LiveFeed as Live Score Feed

    Note over User,LiveFeed: User Authentication Flow
    User->>GW: POST /auth/login (phone + OTP)
    GW->>Auth: Validate OTP
    Auth->>DB: Check user & state compliance
    DB-->>Auth: User data + allowed states
    Auth-->>GW: JWT Token + refresh token
    GW-->>User: Auth success + token

    Note over User,LiveFeed: Real-Time Match Updates
    LiveFeed->>WS: Live score update (WebSocket)
    WS->>Redis: Publish score event
    Redis->>Odds: Trigger odds recalculation
    Odds->>Redis: Update live odds cache
    WS-->>User: Push updated odds (WebSocket)

    Note over User,LiveFeed: Place Bet Flow (<200ms)
    User->>GW: POST /bets/place (match, amount, odds)
    activate GW
    GW->>Auth: Validate JWT
    Auth-->>GW: Token valid
    GW->>Bet: Process bet request
    activate Bet
    Bet->>Redis: Get current odds (cached)
    Redis-->>Bet: Current odds
    Bet->>Wallet: Check balance
    Wallet->>DB: Query wallet balance
    DB-->>Wallet: Balance: ₹5000
    Wallet-->>Bet: Balance sufficient
    Bet->>DB: Lock funds + create bet record
    DB-->>Bet: Bet confirmed
    Bet->>Kafka: Emit BetPlaced event
    Bet-->>GW: Bet confirmation
    deactivate Bet
    GW-->>User: Bet placed successfully
    deactivate GW

    Note over User,LiveFeed: Deposit via UPI
    User->>GW: POST /wallet/deposit (amount, UPI ID)
    GW->>Wallet: Initiate deposit
    Wallet->>UPI: Create payment request
    UPI-->>Wallet: Payment link + txn ID
    Wallet-->>User: Redirect to UPI app
    User->>UPI: Complete payment
    UPI->>Wallet: Payment webhook (success)
    Wallet->>DB: Credit wallet + log transaction
    Wallet->>Kafka: Emit DepositCompleted
    Wallet-->>User: Push notification - Deposit success
```

### Database Schema

```mermaid
erDiagram
    USER ||--o{ BET : places
    USER ||--|| WALLET : has
    USER ||--o{ TRANSACTION : makes
    USER ||--o{ KYC_DOCUMENT : submits
    USER }o--|| STATE_REGULATION : governed_by

    MATCH ||--o{ BET : receives
    MATCH ||--o{ ODDS : has
    MATCH }o--|| SPORT : belongs_to
    MATCH }o--|| TOURNAMENT : part_of

    BET ||--|| TRANSACTION : triggers
    BET }o--|| BET_TYPE : categorized_as

    WALLET ||--o{ TRANSACTION : records

    USER {
        uuid id PK
        string phone_number UK
        string email
        string full_name
        string state_code FK
        boolean is_verified
        boolean is_blocked
        timestamp created_at
        timestamp last_login
    }

    WALLET {
        uuid id PK
        uuid user_id FK
        decimal balance
        decimal locked_amount
        string currency
        timestamp updated_at
    }

    BET {
        uuid id PK
        uuid user_id FK
        uuid match_id FK
        uuid odds_id FK
        string bet_type_code FK
        decimal stake_amount
        decimal odds_value
        decimal potential_payout
        string status
        timestamp placed_at
        timestamp settled_at
    }

    MATCH {
        uuid id PK
        string sport_code FK
        uuid tournament_id FK
        string team_a
        string team_b
        timestamp start_time
        string status
        json live_score
        string external_feed_id
    }

    ODDS {
        uuid id PK
        uuid match_id FK
        string market_type
        string selection
        decimal odds_value
        boolean is_active
        timestamp updated_at
    }

    TRANSACTION {
        uuid id PK
        uuid user_id FK
        uuid wallet_id FK
        uuid bet_id FK
        string type
        decimal amount
        string payment_method
        string payment_reference
        string status
        timestamp created_at
    }

    STATE_REGULATION {
        string state_code PK
        string state_name
        boolean betting_allowed
        decimal max_bet_limit
        decimal tax_percentage
        json restricted_sports
    }

    KYC_DOCUMENT {
        uuid id PK
        uuid user_id FK
        string document_type
        string document_number
        string verification_status
        timestamp submitted_at
        timestamp verified_at
    }

    SPORT {
        string code PK
        string name
        boolean is_active
    }

    TOURNAMENT {
        uuid id PK
        string sport_code FK
        string name
        timestamp start_date
        timestamp end_date
    }

    BET_TYPE {
        string code PK
        string name
        string description
    }
```

### Deployment Architecture

```mermaid
flowchart LR
    subgraph AppStores["App Distribution"]
        PlayStore["Google Play Store\n(Android APK)"]
        AppStore["Apple App Store\n(iOS IPA)"]
    end

    subgraph Users["End Users"]
        AndroidUsers["Android Users\n(100K concurrent)"]
        iOSUsers["iOS Users"]
        AdminUsers["Admin Users\n(Browser)"]
    end

    subgraph AWS_Global["AWS Global Services"]
        Route53["Route 53\nGeo-based Routing"]
        CloudFront["CloudFront CDN\n(Admin Panel)"]
        S3["S3 Bucket\n(Static Assets)"]
    end

    subgraph Mumbai["AWS Mumbai (ap-south-1) - Primary"]
        subgraph MumbaiLB["Load Balancing"]
            ALB1["Application\nLoad Balancer"]
            NLB1["Network LB\n(WebSocket)"]
        end
        subgraph MumbaiEKS["EKS Cluster"]
            APIGWPod1["API Gateway\nPods (x6)"]
            BetEnginePod1["Bet Engine\nPods (x10)"]
            OddsPod1["Odds Service\nPods (x4)"]
            WalletPod1["Wallet Service\nPods (x4)"]
            AuthPod1["Auth Service\nPods (x4)"]
            WSPod1["WebSocket\nPods (x8)"]
            AdminPod1["Admin API\nPods (x2)"]
        end
        subgraph MumbaiData["Data Stores"]
            RDSPrimary[("RDS PostgreSQL\nPrimary")]
            ElastiCache1[("ElastiCache\nRedis Cluster")]
            DocDB1[("DocumentDB\nMongoDB")]
        end
        subgraph MumbaiStream["Streaming"]
            MSK1["Amazon MSK\n(Kafka)"]
        end
    end

    subgraph Singapore["AWS Singapore (ap-southeast-1) - DR"]
        subgraph SingaporeLB["Load Balancing"]
            ALB2["Application\nLoad Balancer"]
            NLB2["Network LB\n(WebSocket)"]
        end
        subgraph SingaporeEKS["EKS Cluster (Standby)"]
            APIGWPod2["API Gateway\nPods (x4)"]
            BetEnginePod2["Bet Engine\nPods (x6)"]
            WSPod2["WebSocket\nPods (x4)"]
        end
        subgraph SingaporeData["Data Stores"]
            RDSReplica[("RDS PostgreSQL\nRead Replica")]
            ElastiCache2[("ElastiCache\nRedis Replica")]
        end
    end

    subgraph External["External Services"]
        LiveScoreAPI["Live Score\nWebSocket Feed"]
        NPCI["NPCI UPI\nGateway"]
        PaytmGW["Paytm Payment\nGateway"]
        FCM["Firebase Cloud\nMessaging"]
        MSG91["MSG91\nSMS Gateway"]
    end

    subgraph Monitoring["Observability"]
        CloudWatch["CloudWatch\nMetrics & Logs"]
        XRay["AWS X-Ray\nTracing"]
        Grafana["Grafana\nDashboards"]
    end

    AndroidUsers --> PlayStore
    iOSUsers --> AppStore
    PlayStore --> Route53
    AppStore --> Route53
    AdminUsers --> CloudFront
    CloudFront --> S3
    CloudFront --> ALB1
    Route53 --> ALB1
    Route53 --> ALB2
    ALB1 --> APIGWPod1
    NLB1 --> WSPod1
    APIGWPod1 --> BetEnginePod1
    APIGWPod1 --> OddsPod1
    APIGWPod1 --> WalletPod1
    APIGWPod1 --> AuthPod1
    APIGWPod1 --> AdminPod1
    BetEnginePod1 --> ElastiCache1
    BetEnginePod1 --> RDSPrimary
    BetEnginePod1 --> MSK1
    WalletPod1 --> RDSPrimary
    WalletPod1 --> NPCI
    WalletPod1 --> PaytmGW
    WSPod1 --> ElastiCache1
    WSPod1 --> LiveScoreAPI
    MSK1 --> DocDB1
    RDSPrimary --> RDSReplica
    ElastiCache1 --> ElastiCache2
    ALB2 --> APIGWPod2
    NLB2 --> WSPod2
    MumbaiEKS --> CloudWatch
    MumbaiEKS --> XRay
    CloudWatch --> Grafana
```

## Architecture Narrative

Design a real-time sports betting platform called "BetStream" for the Indian market. It must handle 100,000 concurrent users during IPL matches, process bets within 200ms, integrate with live score feeds via WebSocket, support UPI and Paytm payments, comply with state-level gambling regulations, and provide a web-based admin panel plus Android and iOS apps for bettors. Need multi-region deployment (Mumbai + Singapore) with automatic failover.


---
*Generated by Blueprint Brain 1.7*
