import { Response, Router } from "express";

import { ErrorMessage, MessageWithEntityId } from "../types/models/messages";
import { RequestWithBody, RequestWithQuery } from "../types/types";
import { CommentGetQuery, CommentPostBody } from "../types/models/comment";
import { CommentsService } from "../services/comments-service";

export const getCommentsRouter = (commentsService: CommentsService) => {
  const router = Router();

  router.get(
    "/",
    async (
      req: RequestWithQuery<CommentGetQuery>,
      res: Response<Comment[] | ErrorMessage>
    ) => {
      try {
        const comments = await commentsService.getComments(req.query);
        res.json(comments);
      } catch (error) {
        console.error("Ошибка чтения данных", error);
        res.status(500).json({ error: "Ошибка получения данных" });
      }
    }
  );

  router.post(
    "/",
    async (
      req: RequestWithBody<CommentPostBody>,
      res: Response<MessageWithEntityId | ErrorMessage>
    ) => {
      try {
        const postResult = await commentsService.postComment(req.body);
        res.status(201).json(postResult);
      } catch (error) {
        console.error("Ошибка сохранения данных", error);
        res.status(500).json({ error: "Ошибка сохранения данных" });
      }
    }
  );

  return router;
};
