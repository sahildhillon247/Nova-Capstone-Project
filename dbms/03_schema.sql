
-- ==========================================
-- Nova Placement Preparation Platform
-- Database Schema
-- Normalized up to Third Normal Form (3NF)
-- ==========================================

CREATE TABLE Users (
    user_id VARCHAR(20) PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE Platforms (
    platform_id VARCHAR(20) PRIMARY KEY,
    platform_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Problems (
    problem_id VARCHAR(20) PRIMARY KEY,
    problem_title VARCHAR(200) NOT NULL,
    platform_id VARCHAR(20) NOT NULL,
    problem_url TEXT,
    difficulty VARCHAR(20)
        CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),

    FOREIGN KEY (platform_id)
        REFERENCES Platforms(platform_id)
);

CREATE TABLE Topics (
    topic_id VARCHAR(20) PRIMARY KEY,
    topic_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Problem_Topics (
    problem_id VARCHAR(20),
    topic_id VARCHAR(20),

    PRIMARY KEY (problem_id, topic_id),

    FOREIGN KEY (problem_id)
        REFERENCES Problems(problem_id)
        ON DELETE CASCADE,

    FOREIGN KEY (topic_id)
        REFERENCES Topics(topic_id)
        ON DELETE CASCADE
);

CREATE TABLE User_Progress (
    user_id VARCHAR(20),
    problem_id VARCHAR(20),
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Pending', 'Attempted', 'Solved')),

    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    PRIMARY KEY (user_id, problem_id),

    FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (problem_id)
        REFERENCES Problems(problem_id)
        ON DELETE CASCADE,

    CHECK (
        completed_at IS NULL
        OR started_at IS NULL
        OR completed_at >= started_at
    )
);

-- ==========================================
-- Verify table creation
-- ==========================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
