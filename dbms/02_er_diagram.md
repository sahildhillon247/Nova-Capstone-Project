# Entity Relationship Diagram (ERD)
## Nova Placement Preparation Platform

This document describes the database entities, attributes, primary keys,
foreign keys, and relationships used in the Nova Placement Preparation Platform.

## 1. ER Diagram

```mermaid
erDiagram
    USERS {
        VARCHAR user_id PK
        VARCHAR user_name
        VARCHAR email UK
        VARCHAR password_hash
    }

    PLATFORMS {
        VARCHAR platform_id PK
        VARCHAR platform_name UK
    }

    PROBLEMS {
        VARCHAR problem_id PK
        VARCHAR problem_title
        VARCHAR platform_id FK
        TEXT problem_url
        VARCHAR difficulty
    }

    TOPICS {
        VARCHAR topic_id PK
        VARCHAR topic_name UK
    }

    PROBLEM_TOPICS {
        VARCHAR problem_id PK, FK
        VARCHAR topic_id PK, FK
    }

    USER_PROGRESS {
        VARCHAR user_id PK, FK
        VARCHAR problem_id PK, FK
        VARCHAR status
        TIMESTAMP started_at
        TIMESTAMP completed_at
    }

    PLATFORMS ||--o{ PROBLEMS : contains
    USERS ||--o{ USER_PROGRESS : tracks
    PROBLEMS ||--o{ USER_PROGRESS : has
    PROBLEMS ||--o{ PROBLEM_TOPICS : belongs_to
    TOPICS ||--o{ PROBLEM_TOPICS : categorizes
