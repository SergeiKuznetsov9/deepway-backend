import { Router } from "express";
import { MongoClient, ObjectId } from "mongodb";

export const getArticleRouter = (client: MongoClient) => {
  const router = Router();

  router.get("/", async (req, res) => {
    let articles: any[] = [];

    const { _expand, _sort, _page, _limit, _order, q, type } = req.query;

    const pipeline: any[] = [];

    if (type && type !== "ALL") {
      pipeline.push({
        $match: {
          type: type,
        },
      });
    }

    if (q) {
      pipeline.push({
        $match: {
          title: { $regex: q, $options: "i" },
        },
      });
    }

    if (_sort) {
      const sortOrder = _order === "desc" ? -1 : 1;

      if (_sort === "created") {
        pipeline.push(
          {
            $addFields: {
              parsedDate: {
                $dateFromString: {
                  dateString: "$createdAt",
                  format: "%d.%m.%Y",
                },
              },
            },
          },
          {
            $sort: { parsedDate: sortOrder },
          }
        );
      }

      if (_sort === "title") {
        pipeline.push(
          {
            $addFields: {
              titleLower: { $toLower: "$title" },
            },
          },
          {
            $sort: { titleLower: sortOrder },
          },
          {
            $project: {
              titleLower: 0,
            },
          }
        );
      }

      if (_sort === "views") {
        pipeline.push({
          $sort: { views: sortOrder },
        });
      }
    }

    if (_limit && !_page) {
      pipeline.push({
        $limit: Number(_limit),
      });
    }

    if (_limit && _page) {
      const skip = (Number(_page) - 1) * Number(_limit);
      pipeline.push({
        $skip: skip,
      });
      pipeline.push({
        $limit: Number(_limit),
      });
    }

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
        { $unset: ["user.password"] }
      );
    }

    try {
      articles = (await client
        .db("deepway")
        .collection("articles")
        .aggregate(pipeline)
        .toArray()) as any[];
    } catch (error) {
      console.error("Ошибка чтения данных", error);
      res.status(500).json({ error: "Ошибка получения данных" });
      return;
    }

    res.json(articles);
  });

  router.get("/:id", async (req, res) => {
    const requestedId = req.params.id;

    try {
      const article = await client
        .db("deepway")
        .collection("articles")
        .aggregate([
          { $match: { _id: new ObjectId(requestedId) } },
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
          { $unset: ["userIdObject", "user.password"] },
        ])
        .next();
      res.json(article);
    } catch (error) {
      console.error("Ошибка чтения данных", error);
      res.status(500).json({ error: "Ошибка получения данных" });
    }
  });
  return router;
};
