# Nova Placement Preparation Platform - ER Diagram

## Entities
- USERS: user_id (PK), user_name, email (UNIQUE), password_hash.
- PLATFORMS: platform_id (PK), platform_name (UNIQUE).
- PROBLEMS: problem_id (PK), problem_title, platform_id (FK), problem_url, difficulty.
- TOPICS: topic_id (PK), topic_name (UNIQUE).
- PROBLEM_TOPICS: composite primary key (problem_id, topic_id).
- USER_PROGRESS: composite primary key (user_id, problem_id).

## Relationships
1. One platform provides many problems.
2. One user can have many progress records.
3. One problem can appear in many progress records.
4. Problems and topics have a many-to-many relationship through PROBLEM_TOPICS.

## Constraints
- Email, platform_name, and topic_name are unique.
- Difficulty: Easy, Medium, Hard.
- Status: Pending, Attempted, Solved.
- Junction table foreign keys use ON DELETE CASCADE.
- Refer to 03_schema.sql for complete definitions.
