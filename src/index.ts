import { runDb } from "./db";
import { createApp } from "./app";

const port = process.env.PORT || 3000;

const startApp = async () => {
  await runDb();
  const app = createApp();
  app.listen(port, () => {
    console.log(`Deepway app is listening on port ${port}`);
  });
};

startApp();
