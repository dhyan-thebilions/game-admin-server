const express = require("express");
const { ParseServer } = require("parse-server");
const ParseDashboard = require("parse-dashboard");
const cors = require("cors");
require("dotenv").config();
const app = express();

// Add CORS middleware
app.use(cors());

// Parse Server initialization
async function startParseServer() {
  const parseServer = new ParseServer({
    databaseURI: process.env.DB_URL,
    cloud: "./cloud/main.js",
    serverURL: process.env.SERVER_URL,
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    encodeParseObjectInCloudFunction: false,

    masterKeyIps: ['::ffff:103.251.227.112', '::ffff:150.129.113.79', '::1'],
    // cors: ['https://master.d1ia27u0hflr52.amplifyapp.com']
  });

  // Start Parse Server
  await parseServer.start();

  // Mount Parse Server at '/parse' URL prefix
  app.use("/parse", parseServer.app);

  // Configure Parse Dashboard (optional)
  const dashboard = new ParseDashboard({
    apps: [
      {
        serverURL: process.env.SERVER_URL,
        appId: process.env.APP_ID,
        masterKey: process.env.MASTER_KEY,
        appName: process.env.APP_NAME,
      },
    ],
    users: [
      {
        user: "admin",
        pass: "password",
      },
    ],
    // Allow insecure HTTP (for development only)
    allowInsecureHTTP: true,
  });

  // Mount Parse Dashboard at '/dashboard' URL prefix (optional)
  app.use("/dashboard", dashboard);

  // Start the server
  const port = 1337;
  app.listen(port, function () {
    console.log(
      `##### parse-server running on ${process.env.SERVER_URL} #####`
    );
  });
}

// Call the async function to start Parse Server
startParseServer().catch((err) =>
  console.error("Error starting Parse Server:", err)
);
