-- Record Library database schema (PostgreSQL)

BEGIN;

-- Users
CREATE TABLE user_table (
    u_id          BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    password      TEXT         NOT NULL,
    register_date TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Libraries
CREATE TABLE library_table (
    l_id          BIGSERIAL    PRIMARY KEY,
    l_name        VARCHAR(128) NOT NULL,
    creation_date TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Records (albums / tracks)
-- Sourced from Discogs. `discogs_id` is the canonical Discogs release id;
-- the other columns are a local cache of release metadata so we don't
-- have to hit the Discogs API on every read.
CREATE TABLE record_table (
    r_id       BIGSERIAL    PRIMARY KEY,
    discogs_id BIGINT       NOT NULL UNIQUE,
    master_id  BIGINT,
    r_name     VARCHAR(255) NOT NULL,
    artist     TEXT         NOT NULL,
    year       SMALLINT,
    thumb_url  TEXT,
    fetched_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Genres for records (a record can have multiple genres on Discogs)
CREATE TABLE record_genre_table (
    r_id  BIGINT      NOT NULL REFERENCES record_table(r_id) ON DELETE CASCADE,
    genre VARCHAR(64) NOT NULL,
    PRIMARY KEY (r_id, genre)
);

-- Membership: which users belong to which libraries, and at what level
CREATE TABLE user_library_membership_table (
    u_id  BIGINT NOT NULL REFERENCES user_table(u_id)    ON DELETE CASCADE,
    l_id  BIGINT NOT NULL REFERENCES library_table(l_id) ON DELETE CASCADE,
    level TEXT   NOT NULL DEFAULT 'member'
        CHECK (level IN ('owner', 'member')),
    PRIMARY KEY (u_id, l_id)
);

-- Inventory: which records are in which library, and which user added them
CREATE TABLE library_inventory_table (
    l_id BIGINT NOT NULL REFERENCES library_table(l_id) ON DELETE CASCADE,
    r_id BIGINT NOT NULL REFERENCES record_table(r_id)  ON DELETE RESTRICT,
    u_id BIGINT NOT NULL REFERENCES user_table(u_id)    ON DELETE RESTRICT,
    PRIMARY KEY (l_id, r_id)
);

-- Helpful secondary indexes for common lookups
CREATE INDEX idx_membership_l_id        ON user_library_membership_table (l_id);
CREATE INDEX idx_inventory_r_id         ON library_inventory_table       (r_id);
CREATE INDEX idx_inventory_u_id         ON library_inventory_table       (u_id);
CREATE INDEX idx_record_genre_genre     ON record_genre_table            (genre);

COMMIT;
