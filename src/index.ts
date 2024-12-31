import { runDb } from "./db/db";
import { createApp } from "./app";

const port = process.env.PORT || 3000;

const startApp = async () => {
  const client = await runDb();
  const app = createApp(client, 'deepway');
  app.listen(port, () => {
    console.log(`Deepway app is listening on port ${port}`);
  });
};

startApp();
