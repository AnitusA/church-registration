// server.ts
import { createRequestHandler } from "@remix-run/express";
import express from "express";

const app = express();

app.use(express.static("public"));

app.all(
  "*",
  createRequestHandler({
    build: require("./build"),
    getLoadContext() {
      return { env: process.env };
    },
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});