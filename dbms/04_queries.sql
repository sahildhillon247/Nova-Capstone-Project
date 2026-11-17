-- =====================================================
-- Nova Placement Preparation Platform
-- CP3: SQL Queries
-- =====================================================

-- Q1. Display all users
SELECT *
FROM users;


-- Q2. Display all coding problems
SELECT *
FROM problems;


-- Q3. Find problems according to difficulty
SELECT problem_id, problem_title, difficulty
FROM problems
WHERE difficulty = 'Easy'
ORDER BY problem_title;


-- Q4. Display problems with their platform names
SELECT
    p.problem_id,
    p.problem_title,
    pl.platform_name,
    p.difficulty
FROM problems p
JOIN platforms pl
    ON p.platform_id = pl.platform_id;


-- Q5. Display problems with their associated topics
SELECT
    p.problem_title,
    t.topic_name
FROM problems p
JOIN problem_topics pt
    ON p.problem_id = pt.problem_id
JOIN topics t
    ON pt.topic_id = t.topic_id
ORDER BY p.problem_title;


-- Q6. Find all solved problems of a particular user
SELECT
    u.user_name,
    p.problem_title,
    up.completed_at
FROM user_progress up
JOIN users u
    ON up.user_id = u.user_id
JOIN problems p
    ON up.problem_id = p.problem_id
WHERE up.user_id = 'U001'
AND up.status = 'Solved';


-- Q7. Count problems according to difficulty
SELECT
    difficulty,
    COUNT(*) AS total_problems
FROM problems
GROUP BY difficulty
ORDER BY total_problems DESC;


-- Q8. Count problems available on each platform
SELECT
    pl.platform_name,
    COUNT(p.problem_id) AS total_problems
FROM platforms pl
LEFT JOIN problems p
    ON pl.platform_id = p.platform_id
GROUP BY pl.platform_id, pl.platform_name
ORDER BY total_problems DESC;


-- Q9. Count problems associated with each topic
SELECT
    t.topic_name,
    COUNT(pt.problem_id) AS total_problems
FROM topics t
LEFT JOIN problem_topics pt
    ON t.topic_id = pt.topic_id
GROUP BY t.topic_id, t.topic_name
ORDER BY total_problems DESC;


-- Q10. Find topic-wise solved problems for a user
SELECT
    t.topic_name,
    COUNT(DISTINCT up.problem_id) AS solved_problems
FROM user_progress up
JOIN problem_topics pt
    ON up.problem_id = pt.problem_id
JOIN topics t
    ON pt.topic_id = t.topic_id
WHERE up.user_id = 'U001'
AND up.status = 'Solved'
GROUP BY t.topic_id, t.topic_name
ORDER BY solved_problems DESC;


-- Q11. Calculate overall progress of every user
SELECT
    u.user_id,
    u.user_name,
    COUNT(up.problem_id) AS attempted_problems,
    COUNT(CASE WHEN up.status = 'Solved' THEN 1 END)
        AS solved_problems
FROM users u
LEFT JOIN user_progress up
    ON u.user_id = up.user_id
GROUP BY u.user_id, u.user_name
ORDER BY solved_problems DESC;


-- Q12. Find problems that have never been attempted
SELECT
    p.problem_id,
    p.problem_title
FROM problems p
WHERE NOT EXISTS (
    SELECT 1
    FROM user_progress up
    WHERE up.problem_id = p.problem_id
);


-- Q13. Find problems harder than the average difficulty rank
-- Easy = 1, Medium = 2, Hard = 3
SELECT
    problem_id,
    problem_title,
    difficulty
FROM problems
WHERE
    CASE difficulty
        WHEN 'Easy' THEN 1
        WHEN 'Medium' THEN 2
        WHEN 'Hard' THEN 3
    END
    >
    (
        SELECT AVG(
            CASE difficulty
                WHEN 'Easy' THEN 1
                WHEN 'Medium' THEN 2
                WHEN 'Hard' THEN 3
            END
        )
        FROM problems
    );


-- Q14. Find users who have solved at least one problem
SELECT
    u.user_id,
    u.user_name
FROM users u
WHERE EXISTS (
    SELECT 1
    FROM user_progress up
    WHERE up.user_id = u.user_id
    AND up.status = 'Solved'
);


-- Q15. Demonstrate INSERT, UPDATE and DELETE operations
-- The transaction is rolled back to avoid permanent sample data changes.

BEGIN;

-- Insert a demo user
INSERT INTO users (user_id, user_name, email, password_hash)
VALUES (
    'CP3_DEMO_USER',
    'Demo Student',
    'cp3_demo@example.com',
    'demo_hash'
);

-- Insert a demo platform
INSERT INTO platforms (platform_id, platform_name)
VALUES ('CP3_DEMO_PLATFORM', 'Demo Platform');

-- Insert a demo problem
INSERT INTO problems (
    problem_id,
    problem_title,
    platform_id,
    problem_url,
    difficulty
)
VALUES (
    'CP3_DEMO_PROBLEM',
    'Demo Coding Problem',
    'CP3_DEMO_PLATFORM',
    'https://example.com/demo',
    'Easy'
);

-- Insert a demo topic
INSERT INTO topics (topic_id, topic_name)
VALUES ('CP3_DEMO_TOPIC', 'Demo Topic');

-- Associate the problem with the topic
INSERT INTO problem_topics (problem_id, topic_id)
VALUES ('CP3_DEMO_PROBLEM', 'CP3_DEMO_TOPIC');

-- Insert initial progress
INSERT INTO user_progress (
    user_id,
    problem_id,
    status,
    started_at
)
VALUES (
    'CP3_DEMO_USER',
    'CP3_DEMO_PROBLEM',
    'Attempted',
    CURRENT_TIMESTAMP
);

-- Update progress status
UPDATE user_progress
SET status = 'Solved',
    completed_at = CURRENT_TIMESTAMP
WHERE user_id = 'CP3_DEMO_USER'
AND problem_id = 'CP3_DEMO_PROBLEM';

-- Delete the demo progress record
DELETE FROM user_progress
WHERE user_id = 'CP3_DEMO_USER'
AND problem_id = 'CP3_DEMO_PROBLEM';

-- Roll back all demo changes
ROLLBACK;

-- =====================================================
-- End of CP3 SQL Queries
-- =====================================================
