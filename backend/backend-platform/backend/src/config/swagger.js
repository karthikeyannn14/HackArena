const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Hackathon Management Platform API",
            version: "1.0.0",
            description:
                "Local/offline REST API for the Hackathon Management Platform",
        },

        servers: [
            {
                url: "http://localhost:5000",
                description: "Local development server",
            },
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },

            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            example: "6ab8abc1c8bc2a9d00a529ee",
                        },
                        name: {
                            type: "string",
                            example: "John Doe",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "john@example.com",
                        },
                        role: {
                            type: "string",
                            enum: [
                                "PARTICIPANT",
                                "JUDGE",
                                "ORGANIZER",
                                "ADMIN",
                            ],
                            example: "PARTICIPANT",
                        },
                    },
                },

                Event: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            example: "6ab8aff9c8bc2a9d00a529f0",
                        },
                        name: {
                            type: "string",
                            example: "AI Innovation Hackathon",
                        },
                        description: {
                            type: "string",
                            example:
                                "Build innovative AI-powered solutions.",
                        },
                        startDate: {
                            type: "string",
                            format: "date-time",
                        },
                        endDate: {
                            type: "string",
                            format: "date-time",
                        },
                        registrationStart: {
                            type: "string",
                            format: "date-time",
                        },
                        registrationEnd: {
                            type: "string",
                            format: "date-time",
                        },
                        submissionDeadline: {
                            type: "string",
                            format: "date-time",
                        },
                        status: {
                            type: "string",
                            enum: [
                                "DRAFT",
                                "PUBLISHED",
                                "ONGOING",
                                "COMPLETED",
                                "CANCELLED",
                            ],
                            example: "DRAFT",
                        },
                        organizer: {
                            type: "string",
                            description: "User ID of the event organizer",
                        },
                    },
                },

                Team: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            example: "6ab8b8c731f2c7833a29ded1",
                        },
                        name: {
                            type: "string",
                            example: "AI Warriors",
                        },
                        event: {
                            type: "string",
                            description: "Event ID",
                        },
                        owner: {
                            type: "string",
                            description: "User ID of the team owner",
                        },
                    },
                },

                TeamMember: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            example: "6ab8c5c325b666defc1caaee",
                        },
                        team: {
                            type: "string",
                            description: "Team ID",
                        },
                        user: {
                            type: "string",
                            description: "User ID",
                        },
                        role: {
                            type: "string",
                            enum: [
                                "OWNER",
                                "MEMBER",
                            ],
                            example: "MEMBER",
                        },
                    },
                },

                Project: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            example: "6ab8be2ac59929edeb7bb31d",
                        },
                        name: {
                            type: "string",
                            example: "Smart Campus AI",
                        },
                        description: {
                            type: "string",
                            example:
                                "An AI-powered solution for improving campus operations.",
                        },
                        event: {
                            type: "string",
                            description: "Event ID",
                        },
                        team: {
                            type: "string",
                            description: "Team ID",
                        },
                        status: {
                            type: "string",
                            enum: [
                                "DRAFT",
                                "SUBMITTED",
                                "FINALIZED",
                            ],
                            example: "DRAFT",
                        },
                    },
                },

                Submission: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            example: "6ab8c01214820526187c563b",
                        },
                        project: {
                            type: "string",
                            description: "Project ID",
                        },
                        team: {
                            type: "string",
                            description: "Team ID",
                        },
                        event: {
                            type: "string",
                            description: "Event ID",
                        },
                        title: {
                            type: "string",
                            example: "Smart Campus AI",
                        },
                        description: {
                            type: "string",
                            example:
                                "An AI-powered platform for improving campus operations.",
                        },
                        repositoryUrl: {
                            type: "string",
                            example:
                                "https://github.com/example/project",
                        },
                        demoUrl: {
                            type: "string",
                            example:
                                "https://example.com/demo",
                        },
                        status: {
                            type: "string",
                            enum: [
                                "DRAFT",
                                "SUBMITTED",
                                "WITHDRAWN",
                            ],
                            example: "SUBMITTED",
                        },
                        submittedAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                        },
                    },
                },

                Error: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        message: {
                            type: "string",
                            example: "Access denied",
                        },
                    },
                },
            },
        },
    },

    apis: [
        "./src/modules/**/*.routes.js",
    ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;