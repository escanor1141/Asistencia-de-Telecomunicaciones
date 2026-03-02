const { Client } = require('pg');

async function check() {
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@localhost:5432/telecom_attendance"
    });

    try {
        await client.connect();
        console.log("Successfully connected to the default 'postgres' database.");

        // Check if telecom_attendance database exists
        const res = await client.query("SELECT datname, pg_get_userbyid(datdba) as owner FROM pg_database WHERE datname='telecom_attendance';");
        if (res.rows.length > 0) {
            console.log("Database 'telecom_attendance' exists. Owner:", res.rows[0].owner);
        } else {
            console.log("Database 'telecom_attendance' DOES NOT EXIST. Let's create it.");
            await client.query("CREATE DATABASE telecom_attendance;");
            console.log("Created database 'telecom_attendance'.");
        }

        // Check if postgres user has superuser role
        const res2 = await client.query("SELECT rolname, rolsuper FROM pg_roles WHERE rolname='postgres';");
        console.log("User 'postgres' superuser status:", res2.rows[0].rolsuper);

    } catch (err) {
        console.error("Connection error:", err.message);
    } finally {
        await client.end();
    }
}

check();
