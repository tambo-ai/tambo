const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables manually since we are running with ts-node/node
const envPath = path.resolve(__dirname, "../.env.local");
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase keys in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Testing connection to:", supabaseUrl);

  const { data, error } = await supabase.from("bookmarks").select("*").limit(1);

  if (error) {
    console.error("❌ Error fetching query:", error);
    if (error.code === "42P01") {
      console.error(
        "\n💡 HINT: The 'bookmarks' table does not exist. Did you run the 'supabase-schema.sql' script?",
      );
    }
  } else {
    console.log("✅ Connection Successful!");
    console.log("Rows found:", data.length);
    if (data.length === 0) {
      console.log(
        "💡 The table exists but is empty. Try creating a bookmark in the Chat.",
      );
    } else {
      console.log("Sample Data:", data);
    }
  }
}

check();
