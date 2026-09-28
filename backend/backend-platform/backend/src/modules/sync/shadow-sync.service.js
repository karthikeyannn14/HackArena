const { PrismaClient } = require("@prisma/client");

// We instantiate a separate Prisma client for the Member 1 app to use
const prisma = new PrismaClient();

const syncEventToPostgres = async (event) => {
    try {
        await prisma.event.upsert({
            where: { id: event._id.toString() },
            update: { name: event.name },
            create: {
                id: event._id.toString(),
                name: event.name,
            },
        });
    } catch (error) {
        console.error("Shadow sync error (Event):", error);
    }
};

const syncTeamToPostgres = async (team) => {
    try {
        await prisma.team.upsert({
            where: { id: team._id.toString() },
            update: { name: team.name },
            create: {
                id: team._id.toString(),
                name: team.name,
            },
        });
    } catch (error) {
        console.error("Shadow sync error (Team):", error);
    }
};

const syncProjectToPostgres = async (project) => {
    try {
        // Dependency Safety: Ensure parent records exist before inserting the Project shadow
        // The Mongo creation flow guarantees the parent records exist in Mongo, but to be robust
        // in Postgres, we should ideally verify they exist or create minimal placeholders.
        // But since this is a one-way sync called immediately after creation, they *should* exist.
        // We'll rely on the existing upserts.

        await prisma.project.upsert({
            where: { id: project._id.toString() },
            update: {
                name: project.name,
                eventId: project.eventId.toString(),
                teamId: project.teamId.toString(),
            },
            create: {
                id: project._id.toString(),
                name: project.name,
                eventId: project.eventId.toString(),
                teamId: project.teamId.toString(),
            },
        });
    } catch (error) {
        console.error("Shadow sync error (Project):", error);
    }
};

module.exports = {
    syncEventToPostgres,
    syncTeamToPostgres,
    syncProjectToPostgres,
};
