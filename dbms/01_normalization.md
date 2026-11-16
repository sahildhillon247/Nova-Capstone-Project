# Database Normalization – Nova Placement Preparation Platform

## 1. Introduction

Nova is a Placement Preparation Platform that helps students track their coding practice and monitor their preparation progress.

The database stores student details, coding problems, topics, and individual problem-solving records.

This document demonstrates the normalization of Nova's proposed database from an initial unstructured representation to Third Normal Form (3NF).

**Note:** The examples use illustrative sample data. The database design is proposed for the MVP and may be refined during implementation.

## 2. Initial Data Representation (Before Normalization)

Initially, student details, problem information, topics, and solving progress can be represented together.

| user_id | user_name | problem_id | problem_title | topics | status |
|---|---|---|---|---|---|
| U01 | Rahul | P01 | Two Sum | Arrays, Hashing | Solved |
| U01 | Rahul | P02 | Binary Search | Searching | Solved |
| U02 | Aman | P01 | Two Sum | Arrays, Hashing | Pending |

This representation has some problems:

- Multiple topics are stored in a single column.
- Student and problem information is repeated.
- Updating repeated information can lead to inconsistencies.

Therefore, the data needs to be normalized.

## 3. First Normal Form (1NF)

A table satisfies 1NF when every cell contains a single atomic value and there are no repeating groups.

To achieve 1NF, multiple topics are separated into individual records.

**After applying 1NF:**

| user_id | user_name | problem_id | problem_title | topic_id | topic_name | status |
|---|---|---|---|---|---|---|
| U01 | Rahul | P01 | Two Sum | T01 | Arrays | Solved |
| U01 | Rahul | P01 | Two Sum | T02 | Hashing | Solved |
| U01 | Rahul | P02 | Binary Search | T03 | Searching | Solved |
| U02 | Aman | P01 | Two Sum | T01 | Arrays | Pending |
| U02 | Aman | P01 | Two Sum | T02 | Hashing | Pending |

Now every cell contains a single value.

The combination of user_id, problem_id, and topic_id can uniquely identify each row in this initial representation.

Thus, the data satisfies 1NF.

## 4. Second Normal Form (2NF)

A table satisfies 2NF when it is already in 1NF and has no partial dependencies.

In the 1NF representation, the composite key is:

(user_id, problem_id, topic_id)

However, some attributes depend on only part of this key:

- user_id → user_name
- problem_id → problem_title
- topic_id → topic_name
- (user_id, problem_id) → status

These are partial dependencies because the attributes do not depend on the complete composite key.

**To remove these dependencies, the data is divided into separate tables:**

**Users**

| user_id (PK) | user_name |
|---|---|
| U01 | Rahul |
| U02 | Aman |

**Problems**

| problem_id (PK) | problem_title | platform_name |
|---|---|---|
| P01 | Two Sum | LeetCode |
| P02 | Binary Search | LeetCode |

**Topics**

| topic_id (PK) | topic_name |
|---|---|
| T01 | Arrays |
| T02 | Hashing |
| T03 | Searching |

**Problem_Topics**

| problem_id (PK, FK) | topic_id (PK, FK) |
|---|---|
| P01 | T01 |
| P01 | T02 |
| P02 | T03 |

**User_Progress**

| user_id (PK, FK) | problem_id (PK, FK) | status |
|---|---|---|
| U01 | P01 | Solved |
| U01 | P02 | Solved |
| U02 | P01 | Pending |

The composite primary key of User_Progress is (user_id, problem_id).

Now, student details, problem details, and topic details are stored separately. Progress status depends on the complete key.

This removes partial dependencies and achieves 2NF.

## 5. Third Normal Form (3NF)

A table satisfies 3NF when it is already in 2NF and has no transitive dependencies.

Consider the Problems table:

| problem_id | problem_title | platform_id | platform_name |
|---|---|---|---|
| P01 | Two Sum | PL01 | LeetCode |
| P02 | Binary Search | PL01 | LeetCode |

The functional dependencies are:

- problem_id → platform_id
- platform_id → platform_name

Therefore, platform_name depends indirectly on problem_id through platform_id. This is a transitive dependency.

**To remove it, the data is divided into two tables:**

**Problems**

| problem_id (PK) | problem_title | platform_id (FK) |
|---|---|---|
| P01 | Two Sum | PL01 |
| P02 | Binary Search | PL01 |

**Platforms**

| platform_id (PK) | platform_name |
|---|---|
| PL01 | LeetCode |

Now platform information is maintained separately, and Problems references Platforms through a foreign key.

This removes the transitive dependency and helps the database achieve 3NF.

## 6. Final Normalized Database Schema

After applying normalization, the proposed Nova database consists of the following six tables:

| Table | Primary Key | Foreign Key |
|---|---|---|
| Users | user_id | — |
| Problems | problem_id | platform_id |
| Platforms | platform_id | — |
| Topics | topic_id | — |
| Problem_Topics | problem_id, topic_id | Both columns reference their respective tables |
| User_Progress | user_id, problem_id | Both columns reference their respective tables |

### Table Relationships

- One student can have multiple progress records.
- One problem can have multiple progress records from different students.
- One problem can belong to multiple topics.
- One topic can be associated with multiple problems.
- One platform can contain multiple coding problems.

The Problem_Topics table handles the many-to-many relationship between Problems and Topics.

## 7. Functional Dependencies

The main functional dependencies in the final proposed schema are:

- Users: user_id → user_name, email, password_hash
- Problems: problem_id → problem_title, platform_id, problem_url, difficulty
- Platforms: platform_id → platform_name
- Topics: topic_id → topic_name
- Problem_Topics: (problem_id, topic_id) identifies each mapping.
- User_Progress: (user_id, problem_id) → status, started_at, completed_at

These dependencies help identify primary keys and maintain consistency across the database.

## 8. Conclusion

The proposed Nova database is organized into separate related tables to reduce redundant data and avoid insertion, deletion, and update anomalies.

The normalization process from 1NF to 3NF improves data organization, maintains relationships through primary and foreign keys, and provides a structured foundation for the Placement Preparation Platform.