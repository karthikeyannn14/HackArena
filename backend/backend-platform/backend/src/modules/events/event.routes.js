const express = require("express");

const authenticate = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");
const authorizeEventOwner = require("../../middleware/event.middleware");

const {
    create,
    getAll,
    getOne,
    update,
    remove,
} = require("./event.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Hackathon event management
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all hackathon events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of hackathon events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 */
router.get("/", getAll);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a hackathon event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Event not found
 */
router.get("/:id", getOne);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a hackathon event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - startDate
 *               - endDate
 *               - registrationStart
 *               - registrationEnd
 *               - submissionDeadline
 *             properties:
 *               name:
 *                 type: string
 *                 example: AI Innovation Hackathon
 *               description:
 *                 type: string
 *                 example: Build innovative AI-powered solutions.
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-11-10T09:00:00Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-11-12T18:00:00Z
 *               registrationStart:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-10-20T09:00:00Z
 *               registrationEnd:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-11-05T23:59:59Z
 *               submissionDeadline:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-11-12T17:00:00Z
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Event created successfully
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid event data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid event data
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Authentication required
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 */
router.post(
    "/",
    authenticate,
    authorizeRoles("ORGANIZER", "ADMIN"),
    create
);

/**
 * @swagger
 * /api/events/{id}:
 *   patch:
 *     summary: Update a hackathon event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated AI Hackathon
 *               description:
 *                 type: string
 *                 example: Updated hackathon description.
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               registrationStart:
 *                 type: string
 *                 format: date-time
 *               registrationEnd:
 *                 type: string
 *                 format: date-time
 *               submissionDeadline:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum:
 *                   - DRAFT
 *                   - PUBLISHED
 *                   - ONGOING
 *                   - COMPLETED
 *                   - CANCELLED
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Event updated successfully
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Authentication required
 *       403:
 *         description: Not authorized to manage this event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Event not found
 */
router.patch(
    "/:id",
    authenticate,
    authorizeRoles("ORGANIZER", "ADMIN"),
    authorizeEventOwner,
    update
);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete a hackathon event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Authentication required
 *       403:
 *         description: Not authorized to manage this event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Event not found
 */
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ORGANIZER", "ADMIN"),
    authorizeEventOwner,
    remove
);

module.exports = router;