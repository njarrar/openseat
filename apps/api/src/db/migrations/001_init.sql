-- Reward availability, stored per (carrier, origin, destination, flight date)
-- so any search can be put together from partial cache hits.

CREATE TABLE IF NOT EXISTS award_itineraries (
    carrier          CHAR(2)     NOT NULL,           -- 'EK', 'EY', 'QR'
    origin           CHAR(3)     NOT NULL,
    destination      CHAR(3)     NOT NULL,
    flight_date      DATE        NOT NULL,           -- departure date at the origin
    flight_key       TEXT        NOT NULL,           -- 'EK1' or 'EK3-EK7'
    hub              CHAR(3),                        -- NULL for nonstop
    dep_time         CHAR(5)     NOT NULL,           -- '09:05'
    arr_time         CHAR(5)     NOT NULL,
    day_offset       SMALLINT    NOT NULL DEFAULT 0,
    duration_min     SMALLINT    NOT NULL,
    layover_min      SMALLINT    NOT NULL DEFAULT 0,
    aircraft         TEXT        NOT NULL,           -- aircraft on the longest leg
    separate_tickets BOOLEAN     NOT NULL DEFAULT FALSE,
    currency         CHAR(3)     NOT NULL DEFAULT 'USD',
    -- Per cabin: seats NULL = cabin not sold on this flight, 0 = sold out.
    eco_seats        SMALLINT,
    eco_miles        INTEGER,
    eco_tax          INTEGER,
    eco_saver        BOOLEAN     NOT NULL DEFAULT FALSE,
    prem_seats       SMALLINT,
    prem_miles       INTEGER,
    prem_tax         INTEGER,
    prem_saver       BOOLEAN     NOT NULL DEFAULT FALSE,
    biz_seats        SMALLINT,
    biz_miles        INTEGER,
    biz_tax          INTEGER,
    biz_saver        BOOLEAN     NOT NULL DEFAULT FALSE,
    first_seats      SMALLINT,
    first_miles      INTEGER,
    first_tax        INTEGER,
    first_saver      BOOLEAN     NOT NULL DEFAULT FALSE,
    legs_json        JSONB       NOT NULL,           -- per-leg flight numbers, times and aircraft
    scraped_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (carrier, origin, destination, flight_date, flight_key)
);

-- One row per day we have read, even when the day has no flights at all,
-- so "never read" and "read, nothing there" stay different.
CREATE TABLE IF NOT EXISTS route_days (
    carrier      CHAR(2)     NOT NULL,
    origin       CHAR(3)     NOT NULL,
    destination  CHAR(3)     NOT NULL,
    flight_date  DATE        NOT NULL,
    checked_at   TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (carrier, origin, destination, flight_date)
);

CREATE TABLE IF NOT EXISTS route_searches (
    carrier      CHAR(2)     NOT NULL,
    origin       CHAR(3)     NOT NULL,
    destination  CHAR(3)     NOT NULL,
    day          DATE        NOT NULL,
    searches     INTEGER     NOT NULL DEFAULT 0,
    PRIMARY KEY (carrier, origin, destination, day)
);

CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id           UUID        PRIMARY KEY,
    carrier      CHAR(2)     NOT NULL,
    origin       CHAR(3)     NOT NULL,
    destination  CHAR(3)     NOT NULL,
    cabin        TEXT        NOT NULL CHECK (cabin IN ('economy', 'premium', 'business', 'first')),
    pax          SMALLINT    NOT NULL CHECK (pax BETWEEN 1 AND 6),
    channel      TEXT        NOT NULL CHECK (channel IN ('email', 'telegram', 'whatsapp')),
    address      TEXT        NOT NULL,
    token        TEXT        NOT NULL UNIQUE,
    is_open      BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_today   SMALLINT    NOT NULL DEFAULT 0,
    sent_day     DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_route ON alert_subscriptions (carrier, origin, destination);
