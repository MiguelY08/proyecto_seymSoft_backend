import { z } from "zod";
import { NOTIFICATION_TYPE_VALUES } from "../constants/notificationTypes.js";

const numericIdSchema = z.coerce.number().int().positive();

export const getNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(NOTIFICATION_TYPE_VALUES).optional(),
  isRead: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
}).strict();

export const notificationIdSchema = z.object({
  id: numericIdSchema,
}).strict();

export const createNotificationSchema = z.object({
  idUser: numericIdSchema,
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(500),
  type: z.enum(NOTIFICATION_TYPE_VALUES).default("info"),
  actionUrl: z.string().trim().max(500).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}).strict();

