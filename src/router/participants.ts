import { Hono } from "hono";
import { prisma } from "../utils/prisma.js";
import { zValidator } from "@hono/zod-validator";
import { createParticipantValidation } from "../validation/participant-validation.js";

const ALLOWED_STATUSES = ["REGISTERED", "ATTENDED", "CANCELLED"] as const;

export const participantsRoute = new Hono()
    .get("/", async (c) => {
        const participants = await prisma.participant.findMany({
            orderBy: { createdAt: "asc"},
        });
        return c.json({ data: participants})
    })
    .get("/:id", async (c) => {
        const id = c.req.param("id");

        const participant = await prisma.participant.findFirst({
            where: { id },
            include: { event: true},
        })
        if (!participant) {
            return c.json({ message: "Participant not found"}, 404)
        }

        return c.json({ data: participant});
    })
    .post("/",zValidator("json", createParticipantValidation) , async (c) => {
        const body = c.req.valid("json");
        
        const event = await prisma.event.findFirst({ // MEMASTIKAN EVENT ADA DAN SUDAH PUBLISH
            where: {
                id: body.eventId,
                deletedAt: null,
                status: "PUBLISHED",
            }
        })
        if (!event) {
            return c.json({ message: "Event not found"}, 404)
        }

        try {
            const participant = await prisma.participant.create({
                data: {
                    name: body.name,
                    email: body.email,
                    eventId: body.eventId
                }
            })
            return c.json({ data: participant}, 201)
        } catch (err) {
            return c.json({ message: "Email has been used"}, 409)
        }
    })
    .patch("/:id", async (c) => {
        const id = c.req.param("id");
        const body = await c.req.json();

        if (!body.status) { // WAJIB ISI STATUS
            return c.json({ message: "Status can't be empty"}, 400)
        }
        if (!ALLOWED_STATUSES.includes(body.status)) { // VALIDASI ENUM STATUS
            return c.json({ message: "Invalid status"}, 400)
        }

        const participant = await prisma.participant.update({
            where: { id },
            data: { status: body.status}
        })
        return c.json({ data: participant})
    })
    .delete("/:id", async (c) => {
        const id = c.req.param("id");
        await prisma.participant.delete({
            where: { id }
        })
        return c.json({ message: "Participant deleted"})
    })