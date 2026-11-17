# CP4 – Query Performance Analysis and Indexing

## 1. Objective

The objective of CP4 is to analyze SQL query performance using PostgreSQL EXPLAIN ANALYZE, capture execution plans before and after indexing, and compare execution times.

## 2. Database Environment

- Database: Nova Placement Preparation Platform
- DBMS: PostgreSQL 18.6
- Benchmark dataset: Synthetic data generated using generate_series()
- Benchmark users: 1,000
- Platforms: 10
- Problems: 5,000
- Topics: 20
- Problem-topic mappings: 10,000
- User progress records: 50,000

All benchmark records use the BENCH_ prefix.

## 3. Methodology

1. Insert benchmark data into the database.
2. Run ANALYZE to update PostgreSQL statistics.
3. Capture baseline execution plans using EXPLAIN (ANALYZE, BUFFERS).
4. Create selected indexes based on query access patterns.
5. Run ANALYZE again.
6. Execute the same queries and capture their execution plans.
7. Compare execution times and query execution strategies.

## 4. Indexes Created

The following indexes were created:

```sql
CREATE INDEX idx_problems_difficulty_title
ON problems(difficulty, problem_title);

CREATE INDEX idx_problem_topics_topic_id
ON problem_topics(topic_id);

CREATE INDEX idx_user_progress_user_status
ON user_progress(user_id, status);

CREATE INDEX idx_user_progress_problem_id
ON user_progress(problem_id);

Command complete hone ke baad normal terminal prompt dikhna chahiye. Output bhejna; phir file verify karenge.

**Dhyan rahe:** Sab paste karne ke baad last mein `EOF` alag line par hona chahiye. Phir Enter press karo.

Uske baad normal `%` prompt aayega. Mujhe output bhejna.



### Purpose of Indexes

| Index | Purpose |
|---|---|
| idx_problems_difficulty_title | Supports filtering by difficulty and ordering by problem title |
| idx_problem_topics_topic_id | Supports topic-based lookups and joins |
| idx_user_progress_user_status | Supports filtering by user and status |
| idx_user_progress_problem_id | Supports problem-based lookups and anti-joins |

## 5. Before and After Performance Comparison

| Query | Before (ms) | After (ms) | Observation |
|---|---:|---:|---|
| Q03 – Problems by difficulty | 1.378 | 1.713 | Slower |
| Q04 – Problems and platforms JOIN | 0.969 | 1.635 | Slower |
| Q06 – User progress lookup | 0.163 | 0.412 | Slower |
| Q09 – Topic-wise problem count | 1.998 | 2.880 | Slower |
| Q12 – Problems never attempted | 8.058 | 6.092 | Faster |

## 6. Query Plan Observations

### Q03 – Problems by Difficulty
- PostgreSQL used Sequential Scan before and after indexing.
- The new composite index was not selected.
- Execution time increased from 1.378 ms to 1.713 ms.

### Q04 – Problems and Platforms JOIN
- PostgreSQL used Hash Join in both plans.
- Both tables were accessed using Sequential Scan.
- Execution time increased from 0.969 ms to 1.635 ms.

### Q06 – User Progress Lookup
- Before indexing, PostgreSQL used the existing primary key index.
- After indexing, PostgreSQL used idx_user_progress_user_status.
- The composite index applied both user_id and status conditions.
- Execution time increased from 0.163 ms to 0.412 ms.

### Q09 – Topic-wise Problem Count
- PostgreSQL used Hash Join and HashAggregate in both plans.
- The problem_topics table was accessed using Sequential Scan.
- The new topic_id index was not selected.
- Execution time increased from 1.998 ms to 2.880 ms.

### Q12 – Problems Never Attempted
- Before indexing, PostgreSQL used Sequential Scan on user_progress.
- After indexing, PostgreSQL used Index Only Scan with idx_user_progress_problem_id.
- Execution time decreased from 8.058 ms to 6.092 ms.

## 7. Performance Improvement Calculation

Improvement (%) = ((Before Time - After Time) / Before Time) × 100

For Q12:

((8.058 - 6.092) / 8.058) × 100 = 24.4%

Q12 showed approximately 24.4% lower execution time in the measured runs.

## 8. Conclusion

This experiment demonstrates that indexes do not automatically improve every SQL query.

The PostgreSQL query planner chooses an execution strategy based on table size, query conditions, available indexes, and estimated costs.

The Q12 query benefited from the new problem_id index because PostgreSQL used an Index Only Scan instead of scanning the entire user_progress table.

For Q03, Q04, Q06, and Q09, measured execution times increased despite indexing. This highlights the importance of evaluating actual execution plans instead of assuming that adding indexes always improves performance.

Execution times represent individual benchmark runs and may vary due to caching, system load, and other factors. Repeated measurements would provide a more reliable performance comparison.

## 9. Execution Plan Files

Baseline plans:
- dbms/plans/before/Q03_explain.txt
- dbms/plans/before/Q04_explain.txt
- dbms/plans/before/Q06_explain.txt
- dbms/plans/before/Q09_explain.txt
- dbms/plans/before/Q12_explain.txt

After-index plans:
- dbms/plans/after/Q03_explain.txt
- dbms/plans/after/Q04_explain.txt
- dbms/plans/after/Q06_explain.txt
- dbms/plans/after/Q09_explain.txt
- dbms/plans/after/Q12_explain.txt
