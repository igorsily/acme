import z from "zod";

export const itemStatusEnum = z.enum(["draft", "active", "archived"]);

export const itemListSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	address: z.string().nullable(),
	status: itemStatusEnum,
	createdAt: z.date(),
});

export const itemDetailSchema = z.object({
	id: z.string(),
	slug: z.string().nullable(),
	name: z.string(),
	description: z.string().optional(),
	address: z.string().optional(),
	lat: z.number().min(-90).max(90).optional(),
	lng: z.number().min(-180).max(180).optional(),
	status: itemStatusEnum,
});

export const itemFormSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	description: z.string().optional(),
	status: itemStatusEnum,
	address: z.string().optional(),
	lat: z.number().min(-90).max(90).optional(),
	lng: z.number().min(-180).max(180).optional(),
});

export const itemCreateSchema = itemFormSchema;
export const itemUpdateSchema = itemFormSchema.extend({
	id: z.string().min(1),
});

export const itemGetByIdSchema = z.object({
	id: z.string().min(1),
});

export const itemMapMarkerSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: itemStatusEnum,
	address: z.string().nullable(),
	description: z.string().nullable(),
	lat: z.number(),
	lng: z.number(),
});

export type ItemList = z.infer<typeof itemListSchema>;
export type ItemDetail = z.infer<typeof itemDetailSchema>;
export type ItemFormInput = z.input<typeof itemFormSchema>;
export type ItemFormValues = z.output<typeof itemFormSchema>;
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
export type ItemMapMarker = z.infer<typeof itemMapMarkerSchema>;
export type ItemStatus = z.infer<typeof itemStatusEnum>;
