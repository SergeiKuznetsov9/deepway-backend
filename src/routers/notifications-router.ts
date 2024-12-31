import { Router, Response } from "express";

import { ErrorMessage } from "../types/models/messages";
import { RequestWithParams } from "../types/types";
import {
  Notification,
  NotificationGetParams,
} from "../types/models/notification";
import { NotificationsService } from "../services/notifications-service";

export const getNotificationsRouter = (
  notificationsService: NotificationsService
) => {
  const router = Router();

  router.get(
    "/:userId",
    async (
      req: RequestWithParams<NotificationGetParams>,
      res: Response<Notification[] | ErrorMessage>
    ) => {
      try {
        const notifications =
          await notificationsService.getNotificationsByUserId(
            req.params.userId
          );

        res.json(notifications);
      } catch (error) {
        console.error("Ошибка чтения данных", error);
        res.status(500).json({ error: "Ошибка получения данных" });
      }
    }
  );

  return router;
};
