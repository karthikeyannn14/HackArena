const express = require("express");

const authenticate = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
    create,
    getByProject,
    getByEvent,
} = require("./submission.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Hackathon project submission management
 */

/**
 * @swagger
 * /api/submissions/event/{eventId}:
 *   get:
 *     summary: Get all submissions for an event
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of event submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 submissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submission'
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
router.get(
    "/event/:eventId",
    authenticate,
    authorizeRoles("ORGANIZER", "ADMIN", "JUDGE"),
    getByEvent
);

/**
 * @swagger
 * /api/submissions/project/{projectId}:
 *   get:
 *     summary: Get the submission for a project
 *     tags: [Submissions]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Submission details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 submission:
 *                   $ref: '#/components/schemas/Submission'
 *       404:
 *         description: Submission not found
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
 *                   example: Submission not found
 */
router.get(
    "/project/:projectId",
    getByProject
);

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Create a project submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - teamId
 *               - eventId
 *               - title
 *               - description
 *             properties:
 *               projectId:
 *                 type: string
 *                 example: 6ab8be2ac59929edeb7bb31d
 *               teamId:
 *                 type: string
 *                 example: 6ab8b8c731f2c7833a29ded1
 *               eventId:
 *                 type: string
 *                 example: 6ab8aff9c8bc2a9d00a529f0
 *               title:
 *                 type: string
 *                 example: Smart Campus AI
 *               description:
 *                 type: string
 *                 example: An AI-powered platform for improving campus operations.
 *               repositoryUrl:
 *                 type: string
 *                 example: https://github.com/example/project
 *               demoUrl:
 *                 type: string
 *                 example: https://example.com/demo
 *     responses:
 *       201:
 *         description: Submission created successfully
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
 *                   example: Submission created successfully
 *                 submission:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Invalid submission, unauthorized team membership, duplicate submission, or deadline passed
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
 *                   example: You are not a member of this team
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
    authorizeRoles("PARTICIPANT"),
    create
);

module.exports = router;