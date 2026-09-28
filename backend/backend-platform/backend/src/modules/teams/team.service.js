const prisma = require("../../config/prisma");

const createTeam = async ({ name, eventId, ownerId }) => {
    // Make sure the event exists
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!event) {
        throw new Error("Event not found");
    }

    // Check for duplicate team name within this event
    const existingTeam = await prisma.team.findFirst({
        where: {
            name: name.trim(),
            eventId: eventId,
        }
    });

    if (existingTeam) {
        throw new Error("A team with this name already exists in this event");
    }

    // Create the team and the owner member in a transaction
    const team = await prisma.team.create({
        data: {
            name: name.trim(),
            eventId: eventId,
            ownerId: ownerId,
            members: {
                create: {
                    userId: ownerId,
                    role: "OWNER"
                }
            }
        },
        include: {
            owner: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    return {
        ...team,
        _id: team.id,
        event: team.eventId,
        owner: {
            _id: team.ownerId,
            name: team.owner.name,
            email: team.owner.email
        }
    };
};

const getTeamsByEvent = async (eventId) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!event) {
        throw new Error("Event not found");
    }

    const teams = await prisma.team.findMany({
        where: { eventId: eventId },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return teams.map(team => ({
        ...team,
        _id: team.id,
        event: team.eventId,
        owner: {
            _id: team.owner.id,
            name: team.owner.name,
            email: team.owner.email
        }
    }));
};

const getMembersByTeam = async (teamId) => {
    const members = await prisma.teamMember.findMany({
        where: { teamId: teamId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }
        },
        orderBy: [
            { role: 'desc' }, // OWNER before MEMBER
            { createdAt: 'asc' }
        ]
    });

    return members.map(member => ({
        ...member,
        _id: member.id,
        team: member.teamId,
        user: {
            _id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            role: member.user.role
        }
    }));
};

const addMemberToTeam = async ({
    teamId,
    userId,
    requesterId,
}) => {
    // Find the team
    const team = await prisma.team.findUnique({
        where: { id: teamId }
    });

    if (!team) {
        throw new Error("Team not found");
    }

    // Only the team owner can add members
    if (team.ownerId !== requesterId) {
        throw new Error("Only the team owner can add members");
    }

    // Make sure the user exists
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Check whether the user is already a member
    const existingMember = await prisma.teamMember.findFirst({
        where: {
            teamId: teamId,
            userId: userId,
        }
    });

    if (existingMember) {
        throw new Error("User is already a member of this team");
    }

    // Add the user as a normal member
    const member = await prisma.teamMember.create({
        data: {
            teamId: teamId,
            userId: userId,
            role: "MEMBER",
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });

    return {
        ...member,
        _id: member.id,
        team: member.teamId,
        user: {
            _id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            role: member.user.role
        }
    };
};

const removeMemberFromTeam = async ({
    teamId,
    userId,
    requesterId,
}) => {
    // Find the team
    const team = await prisma.team.findUnique({
        where: { id: teamId }
    });

    if (!team) {
        throw new Error("Team not found");
    }

    // Only the team owner can remove members
    if (team.ownerId !== requesterId) {
        throw new Error("Only the team owner can remove members");
    }

    // Prevent the owner from removing themselves
    if (team.ownerId === userId) {
        throw new Error("Team owner cannot be removed");
    }

    // Find the membership
    const membership = await prisma.teamMember.findFirst({
        where: {
            teamId: teamId,
            userId: userId,
        }
    });

    if (!membership) {
        throw new Error("User is not a member of this team");
    }

    // Remove the membership
    await prisma.teamMember.delete({
        where: { id: membership.id }
    });

    return {
        userId,
        teamId,
    };
};

module.exports = {
    createTeam,
    getTeamsByEvent,
    getMembersByTeam,
    addMemberToTeam,
    removeMemberFromTeam,
};