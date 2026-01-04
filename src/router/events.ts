import { Hono } from "hono";
import { prisma } from "../utils/prisma.js";
import { zValidator } from "@hono/zod-validator";
import { createEventValidation } from "../validation/event-validation.js";

export const eventsRoute = new Hono()
    .get("/", async (c) => { //GET SEMUA EVENT (TIDAK TERMASUK SOFT DELETE)
        const events = await prisma.event.findMany({
            where: {deletedAt: null},
            orderBy: {date: "asc"},
            include: { participants: true}
        });
        return c.json({ data: events})
    })
    .get("/:id", async (c) => {
        const id = c.req.param("id");

        const event = await prisma.event.findFirst({
            where: { id, deletedAt: null},
            include: { participants: true},
        })
        if (!event) {
            return c.json({ message: "Event not found"}, 404)
        }
        
        return c.json({ data: event});
    })
    .post("/", zValidator("json", createEventValidation), async (c) => {
        const body = c.req.valid("json");
        const event = await prisma.event.create({
            data: {
                title: body.title,
                description: body.description,
                date: new Date(body.date), // CONVERT STRING KE DATE
                location: body.location,
            }
        })
        return c.json({ data: event }, 201)  
    })
    .patch("/:id/publish", async (c) => { // UBAH STATUS EVENT MENJADI PUBLISHED UNTUK METHOD PATCH INI
        const id = c.req.param("id")
        const event = await prisma.event.update({
            where: { id },
            data: { status: "PUBLISHED"}
        });
        return c.json({ data: event})
    })
    .delete("/:id", async (c) => { // SOFT DELETE, DATA TIDAK BENAR-BENAR DIHAPUS
        const id = c.req.param("id");
        await prisma.event.update({
            where: { id },
            data: { deletedAt: new Date()} // SET TANGGAL SEKARANG TANDA EVENT SUDAH DI HAPUS
        })
        return c.json({ message: "Event deleted"})
    })