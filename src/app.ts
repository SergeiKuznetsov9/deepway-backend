import express from "express";
import { WithId, Document, MongoClient } from "mongodb";
import { getArticleRouter } from "./routers/articles-router";

export const createApp = (client: MongoClient) => {
  const app = express();

  app.use((req: any, res: any, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept"
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });
  const jsonBodyMiddleware = express.json();
  app.use(jsonBodyMiddleware);

  app.get("/", (req, res) => {
    res.json("Deepway is runing");
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await client
        .db("deepway")
        .collection("users")
        .findOne({ username, password }, { projection: { password: 0 } });

      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({
          error: "Пользователь с таким именем и паролем не существует",
        });
      }
    } catch (error) {
      console.error("Ошибка сохранения данных", error);
      res.status(500).json({ error: "Ошибка сохранения данных" });
    }
  });

  app.use("/articles", getArticleRouter(client))

  app.get("/profile/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
      const profile = await client
        .db("deepway")
        .collection("profile")
        .findOne({ userId });
      res.json(profile);
    } catch (error) {
      console.error("Ошибка чтения данных", error);
      res.status(500).json({ error: "Ошибка получения данных" });
    }
  });

  app.put("/profile/:userId", async (req: any, res: any) => {
    const {
      id,
      age,
      avatar,
      city,
      country,
      currency,
      first,
      lastname,
      username,
    } = req.body;

    try {
      const userId = req.params.userId;

      const result = await client.db("deepway").collection("profile").updateOne(
        { userId },
        {
          $set: {
            first,
            lastname,
            age,
            currency,
            country,
            city,
            username,
            avatar,
          },
        }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Профиль не найден" });
      }

      res.status(200).json({ message: "Профиль обновлён" });
    } catch (error) {
      console.error("Ошибка обновления данных", error);
      res.status(500).json({ error: "Ошибка обновления данных" });
    }
  });

  app.get("/article-ratings", async (req: any, res: any) => {
    const { userId, articleId } = req.query;

    try {
      const articleRating = await client
        .db("deepway")
        .collection("article-ratings")
        .findOne({ userId, articleId });

      res.status(200).json(articleRating);
    } catch (error) {
      console.error("Ошибка получения данных", error);
      res.status(500).json({ error: "Ошибка получения данных" });
    }
  });

  app.post("/article-ratings", async (req, res) => {
    const { articleId, userId, rate, feedback } = req.body;
    const rating = { articleId, userId, rate, feedback };

    try {
      const result = await client
        .db("deepway")
        .collection("article-ratings")
        .insertOne(rating);

      res.status(201).json({ id: result.insertedId.toString() });
    } catch (error) {
      console.error("Ошибка сохранения данных", error);
      res.status(500).json({ error: "Ошибка сохранения данных" });
    }
  });

  app.get("/comments", async (req, res) => {
    const { _expand, articleId } = req.query;
    const pipeline: any[] = [{ $match: { articleId: articleId } }];

    if (_expand === "user") {
      pipeline.push(
        {
          $addFields: {
            userIdObject: {
              $convert: {
                input: "$userId",
                to: "objectId",
              },
            },
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "userIdObject",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $unset: ["userIdObject", "user.password"] }
      );
    }

    try {
      const comments = (await client
        .db("deepway")
        .collection("comments")
        .aggregate(pipeline)
        .toArray()) as WithId<Document>[];
      res.json(comments);
    } catch (error) {
      console.error("Ошибка чтения данных", error);
      res.status(500).json({ error: "Ошибка получения данных" });
    }
  });

  app.post("/comments", async (req, res) => {
    const { articleId, userId, text } = req.body;

    try {
      const comment = { articleId, userId, text };
      const result = await client
        .db("deepway")
        .collection("comments")
        .insertOne(comment);

      res.status(201).json({ id: result.insertedId.toString() });
    } catch (error) {
      console.error("Ошибка сохранения данных", error);
      res.status(500).json({ error: "Ошибка сохранения данных" });
    }
  });

  app.get("/notifications/:id", async (req, res) => {
    const userId = req.params.id;

    try {
      const notifications = await client
        .db("deepway")
        .collection("notifications")
        .find({ userId })
        .toArray();

      res.json(notifications);
    } catch (error) {
      console.error("Ошибка чтения данных", error);
      res.status(500).json({ error: "Ошибка получения данных" });
    }
  });

  return app;
};
// const port = process.env.PORT || 3000;
