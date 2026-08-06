import { Router } from "express";

import {
  deleteNotificationController,
  deleteAllNotificationsController,
  getNotificationsController,
  getUnreadCountController,
  markAllAsReadController,
  markAsReadController,
} from "../controllers/index.js";

const router = Router();

router.get("/", getNotificationsController);
router.get("/unread-count", getUnreadCountController);
router.patch("/read-all", markAllAsReadController);
router.patch("/:id/read", markAsReadController);
router.delete("/all", deleteAllNotificationsController);
router.delete("/:id", deleteNotificationController);

export default router;
