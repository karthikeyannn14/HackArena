const express = require("express");

const authenticate = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
    create,
    getByTeam,
} = require("./project.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Hackathon project management
 */

/**
 * @swagger
 * /api/projects/team/{teamId}:
 *   get:
 *     summary: Get the project for a team
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
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
 *                   example: Project not found
 */
router.get(
    "/team/:teamId",
    getByTeam
);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a project for a team
 *     tags: [Projects]
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
 *               - eventId
 *               - teamId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Smart Campus AI
 *               description:
 *                 type: string
 *                 example: An AI-powered solution for improving campus operations.
 *               eventId:
 *                 type: string
 *                 example: 6ab8aff9c8bc2a9d00a529f0
 *               teamId:
 *                 type: string
 *                 example: 6ab8b8c731f2c7833a29ded1
 *     responses:
 *       201:
 *         description: Project created successfully
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
 *                   example: Project created successfully
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid request, team membership issue, or team already has a project
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