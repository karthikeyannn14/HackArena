const prisma = require("../../config/prisma");

const createProject = async ({
    name,
    description,
    eventId,
    teamId,
    userId,
}) => {
    // Make sure the event exists
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!event) {
        throw new Error("Event not found");
    }

    // Make sure the team exists and belongs to this event
    const team = await prisma.team.findFirst({
        where: {
            id: teamId,
            eventId: eventId,
        }
    });

    if (!team) {
        throw new Error("Team not found in this event");
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

    // Prevent the team from creating multiple projects
    const existingProject = await prisma.project.findUnique({
        where: { teamId: teamId }
    });

    if (existingProject) {
        throw new Error("This team already has a project");
    }

    const project = await prisma.project.create({
        data: {
            name: name.trim(),
            description: description.trim(),
            eventId: eventId,
            teamId: teamId,
        }
    });

    return {
        ...project,
        _id: project.id,
        event: project.eventId,
        team: project.teamId
    };
};

const getProjectByTeam = async (teamId) => {
    const project = await prisma.project.findUnique({
        where: { teamId: teamId },
        include: {
            event: {
                select: {
                    id: true,
                    name: true,
                    status: true
                }
            },
            team: {
                select: {
                    id: true,
                    name: true,
                    ownerId: true
                }
            }
        }
    });

    if (!project) return null;

    return {
        ...project,
        _id: project.id,
        event: {
            _id: project.event.id,
            name: project.event.name,
            status: project.event.status
        },
        team: {
            _id: project.team.id,
            name: project.team.name,
            owner: project.team.ownerId
        }
    };
};

module.exports = {
    createProject,
    getProjectByTeam,
};