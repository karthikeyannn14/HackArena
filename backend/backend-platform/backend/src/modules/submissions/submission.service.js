const prisma = require("../../config/prisma");

const createSubmission = async ({
    projectId,
    teamId,
    eventId,
    title,
    description,
    repositoryUrl,
    demoUrl,
    userId,
}) => {
    // Make sure the event exists
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!event) {
        throw new Error("Event not found");
    }

    // Make sure the team belongs to this event
    const team = await prisma.team.findFirst({
        where: {
            id: teamId,
            eventId: eventId,
        }
    });

    if (!team) {
        throw new Error("Team not found in this event");
    }

    // Make sure the project belongs to this team and event
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            teamId: teamId,
            eventId: eventId,
        }
    });

    if (!project) {
        throw new Error("Project not found for this team and event");
    }

    // Make sure the authenticated user belongs to the team
    const membership = await prisma.teamMember.findFirst({
        where: {
            teamId: teamId,
            userId: userId,
        }
    });

    if (!membership) {
        throw new Error("You are not a member of this team");
    }

    // Prevent multiple submissions for the same project
    const existingSubmission = await prisma.submission.findUnique({
        where: { projectId: projectId }
    });

    if (existingSubmission) {
        throw new Error("This project already has a submission");
    }

    // Enforce the event submission deadline
    const now = new Date();

    if (now > event.submissionDeadline) {
        throw new Error("The submission deadline has passed");
    }

    const submission = await prisma.submission.create({
        data: {
            projectId: projectId,
            teamId: teamId,
            eventId: eventId,
            title: title.trim(),
            description: description.trim(),
            repositoryUrl: repositoryUrl?.trim() || null,
            demoUrl: demoUrl?.trim() || null,
            status: "SUBMITTED",
            submittedAt: now,
        }
    });

    return {
        ...submission,
        _id: submission.id,
        project: submission.projectId,
        team: submission.teamId,
        event: submission.eventId
    };
};

const getSubmissionByProject = async (projectId) => {
    const submission = await prisma.submission.findUnique({
        where: { projectId: projectId },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    status: true
                }
            },
            team: {
                select: {
                    id: true,
                    name: true,
                    ownerId: true
                }
            },
            event: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    submissionDeadline: true
                }
            }
        }
    });

    if (!submission) return null;

    return {
        ...submission,
        _id: submission.id,
        project: {
            ...submission.project,
            _id: submission.project.id
        },
        team: {
            _id: submission.team.id,
            name: submission.team.name,
            owner: submission.team.ownerId
        },
        event: {
            ...submission.event,
            _id: submission.event.id
        }
    };
};

const getSubmissionsByEvent = async (eventId) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!event) {
        throw new Error("Event not found");
    }

    const submissions = await prisma.submission.findMany({
        where: { eventId: eventId },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    status: true
                }
            },
            team: {
                select: {
                    id: true,
                    name: true,
                    ownerId: true
                }
            },
            event: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    submissionDeadline: true
                }
            }
        },
        orderBy: {
            submittedAt: 'desc'
        }
    });

    return submissions.map(submission => ({
        ...submission,
        _id: submission.id,
        project: {
            ...submission.project,
            _id: submission.project.id
        },
        team: {
            _id: submission.team.id,
            name: submission.team.name,
            owner: submission.team.ownerId
        },
        event: {
            ...submission.event,
            _id: submission.event.id
        }
    }));
};

module.exports = {
    createSubmission,
    getSubmissionByProject,
    getSubmissionsByEvent,
};