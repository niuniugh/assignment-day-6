import z from "zod";

export const createEventValidation = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.coerce.date(),
    location: z.string().min(1)
})