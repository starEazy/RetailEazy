const express = require("express");
const app = express();
const cluster = require("cluster");
const os = require("os");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const port = process.env.PORT || 8000;
const bodyparser = require("body-parser");
const debug = require("debug");
const numCPUs = os.cpus().length;
const commonRoutes = require("./Routes/commonRoutes");
const AuthRoutes = require("./Routes/AuthRoutes");
// const db = require("./database/models/index");
// db.sequelize.sync();

console.log("numCPUs>>>>>>>>>", numCPUs);
console.log("cluster>>>>>>>>", cluster.isMaster);

if (cluster.isMaster) {
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  const server = http.createServer(app);

  app.use((req, res, next) => {
    res.header("X-XSS-Protection", "1; mode=block");
    res.header("X-Frame-Options", "deny");
    res.header("X-Content-Type-Options", "nosniff");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, PUT, POST, DELETE , HEAD , OPTIONS"
    );
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept,Authorization, X-Token"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
  });

  app.use(bodyparser.urlencoded({ extended: false }));
  app.use(bodyparser.json());
  // app.use("/api", routes);
  app.get("/", (req, res) => {
    console.log("API working");
    res.send("API working");
  });

  app.use("/api", commonRoutes);
  app.use("/api/Authenticate", AuthRoutes);

  app.use(
    cors({
      origin: "*",
      allowedHeaders: "*",
      credentials: true,
      optionSuccessStatus: 200,
    })
  );

  app.use(helmet());

  server.listen(port);
  server.on("error", (error) => {
    if (error.syscall !== "listen") {
      throw error;
    }
    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);

      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);

      default:
        throw error;
    }
  });

  server.on("listening", () => {
    const addr = server.address();
    console.info(`The server has started on port: ${port}`);
    const bind =
      typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    debug("Retail Eazy server Listening on " + bind);
  });
}
