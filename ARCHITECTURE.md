# Architecture

Group Ride follows a **Ports & Adapters** (hexagonal) architecture. The domain and business logic live at the centre and depend on nothing external. The outside world (databases, messaging platforms) plugs in through interfaces called *ports*.

**Dependency rule: adapters depend on the domain, never the other way around.**

---

## Layers

```mermaid
graph TD
    subgraph Adapters
        direction LR
        DISCORD["Discord adapter\ndiscord.js"]
        TELEGRAM["Telegram adapter\ngrammY"]
        SQLITE["SQLite adapter\nbun:sqlite"]
        PG["PostgreSQL adapter\nBun SQL"]
    end

    subgraph Services
        RS["RideService"]
        SS["SchedulerService"]
        IMP["Importer\nKomoot · Strava · Garmin"]
    end

    subgraph Domain
        RP["«port»\nRideRepository"]
        MP["«port»\nMessagingPort"]
        RIDE["Ride\nCreateRideInput\nRideLevel · RideStatus"]
    end

    DISCORD  -->|calls| RS
    TELEGRAM -->|calls| RS

    RS --> RP
    RS --> MP
    SS --> RP
    SS --> MP
    IMP --> RIDE

    SQLITE   -.->|implements| RP
    PG       -.->|implements| RP
    DISCORD  -.->|implements| MP
    TELEGRAM -.->|implements| MP
```

| Layer | Role | May import from |
|---|---|---|
| **Domain** | Core types and port interfaces | Nothing outside `domain/` |
| **Services** | Business logic | `domain/` only |
| **Adapters** | I/O implementations | `domain/`, `services/`, each other's `shared/` |

---

## Ports and implementations

```mermaid
classDiagram
    class RideRepository {
        <<interface>>
        +save(ride)
        +findById(id)
        +findActive()
        +findActiveByMember(userId)
        +update(ride)
        +addMember(rideId, userId)
        +removeMember(rideId, userId)
        +getMembers(rideId)
    }

    class MessagingPort {
        <<interface>>
        +announce(ride)
        +createThread(ride)
        +pinSummary(threadId, ride)
        +updatePinnedSummary(threadId, ride, participants)
        +closeThread(threadId)
        +addMemberToThread(threadId, userId)
        +removeMemberFromThread(threadId, userId)
        +notifyThread(threadId, message)
        +notifyMainChannel(message)
    }

    class RideService {
        -rides RideRepository
        -messaging MessagingPort
        +propose(input)
        +join(rideId, userId)
        +leave(rideId, userId)
        +cancel(rideId)
        +update(rideId, changes)
        +removeMemberFromAllActiveRides(userId)
    }

    class SchedulerService {
        -rides RideRepository
        -messaging MessagingPort
        +tick()
        +start()
    }

    class SqliteRideRepository
    class PostgresRideRepository {
        -sql SQL
    }
    class DiscordMessaging
    class TelegramMessaging

    RideService    -->  RideRepository  : uses
    RideService    -->  MessagingPort   : uses
    SchedulerService --> RideRepository : uses
    SchedulerService --> MessagingPort  : uses

    SqliteRideRepository   ..|> RideRepository : implements
    PostgresRideRepository ..|> RideRepository : implements
    DiscordMessaging       ..|> MessagingPort   : implements
    TelegramMessaging      ..|> MessagingPort   : implements
```

---

## Runtime wiring (`index.ts`)

The adapter pair is chosen at startup from environment variables — the domain and services are unchanged regardless of the combination.

```mermaid
flowchart LR
    ENV["Environment"]

    subgraph Storage
        SQLITE["SqliteRideRepository\nDATABASE_URL unset"]
        PG["PostgresRideRepository\nDATABASE_URL set"]
    end

    subgraph Platform
        DS["startDiscord\nADAPTER=discord (default)"]
        TG["startTelegram\nADAPTER=telegram"]
    end

    ENV -->|DATABASE_URL| Storage
    ENV -->|ADAPTER| Platform
    Storage -->|RideRepository| DS
    Storage -->|RideRepository| TG
```

---

## File map

```
src/
├── domain/
│   ├── ride.ts                        # Ride, CreateRideInput, RideLevel, RideStatus
│   └── ports/
│       ├── ride.repository.ts         # RideRepository interface
│       └── messaging.port.ts          # MessagingPort interface
├── services/
│   ├── ride.service.ts                # RideService — orchestrates all ride operations
│   ├── scheduler.service.ts           # SchedulerService — reminders + auto-close
│   └── importer/                      # Komoot / Strava / Garmin URL importers
└── adapters/
    ├── shared/
    │   └── parse.ts                   # Date/stats parsing shared by Discord & Telegram
    ├── discord/                       # discord.js — implements MessagingPort
    │   ├── messaging.ts
    │   ├── commands/                  # /newride, /rides
    │   └── handlers/                  # join, leave, edit, participants, member events
    ├── telegram/                      # grammY — implements MessagingPort
    │   ├── messaging.ts
    │   ├── conversations/             # multi-step /newride flow
    │   └── handlers/                  # join, member events
    ├── sqlite/                        # bun:sqlite — implements RideRepository
    │   ├── db.ts                      # connection + auto-migration runner
    │   └── ride.repo.ts
    └── postgres/                      # Bun SQL — implements RideRepository
        ├── ride.repo.ts
        └── migrations/                # run manually with psql before first start
```
