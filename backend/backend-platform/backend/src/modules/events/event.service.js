const prisma = require("../../config/prisma");

const validateEventDates = ({
    startDate,
    endDate,
    registrationStart,
    registrationEnd,
    submissionDeadline,
}) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);
    const submission = new Date(submissionDeadline);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        Number.isNaN(regStart.getTime()) ||
        Number.isNaN(regEnd.getTime()) ||
        Number.isNaN(submission.getTime())
    ) {
        throw new Error("Invalid event date configuration");
    }

    if (
        regStart >= regEnd ||
        regEnd > start ||
        start >= end ||
        submission > end
    ) {
        throw new Error("Invalid event date configuration");
    }
};

const createEvent = async ({
    name,
    description,
    startDate,
    endDate,
    registrationStart,
    registrationEnd,
    submissionDeadline,
    organizer,
}) => {
    validateEventDates({
        startDate,
        endDate,
        registrationStart,
        registrationEnd,
        submissionDeadline,
    });

    const event = await prisma.event.create({
        data: {
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            registrationStart: new Date(registrationStart),
            registrationEnd: new Date(registrationEnd),
            submissionDeadline: new Date(submissionDeadline),
            organizerId: organizer, // Assuming organizer is the string ID
        },
        include: {
            organizer: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    // Remap for compatibility with frontend expectations
    return {
        ...event,
        _id: event.id,
        organizer: {
            _id: event.organizer.id,
            name: event.organizer.name,
            email: event.organizer.email
        }
    };
};

const getEvents = async () => {
    const events = await prisma.event.findMany({
        include: {
            organizer: {
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

    return events.map(event => ({
        ...event,
        _id: event.id,
        organizer: {
            _id: event.organizer.id,
            name: event.organizer.name,
            email: event.organizer.email
        }
    }));
};

const getEventById = async (eventId) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    if (!event) return null;

    return {
        ...event,
        _id: event.id,
        organizer: {
            _id: event.organizer.id,
            name: event.organizer.name,
            email: event.organizer.email
        }
    };
};

const updateEvent = async (eventId, updates) => {
    const existingEvent = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!existingEvent) {
        return null;
    }

    const finalStartDate = new Date(
        updates.startDate ?? existingEvent.startDate
    );

    const finalEndDate = new Date(
        updates.endDate ?? existingEvent.endDate
    );

    const finalRegistrationStart = new Date(
        updates.registrationStart ?? existingEvent.registrationStart
    );

    const finalRegistrationEnd = new Date(
        updates.registrationEnd ?? existingEvent.registrationEnd
    );

    const finalSubmissionDeadline = new Date(
        updates.submissionDeadline ?? existingEvent.submissionDeadline
    );

    validateEventDates({
        startDate: finalStartDate,
        endDate: finalEndDate,
        registrationStart: finalRegistrationStart,
        registrationEnd: finalRegistrationEnd,
        submissionDeadline: finalSubmissionDeadline,
    });
    
    // Remove organizer from updates if present to avoid relation issues
    const { organizer, _id, ...cleanUpdates } = updates;

    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
            ...cleanUpdates,
            startDate: finalStartDate,
            endDate: finalEndDate,
            registrationStart: finalRegistrationStart,
            registrationEnd: finalRegistrationEnd,
            submissionDeadline: finalSubmissionDeadline,
        },
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    return {
        ...updatedEvent,
        _id: updatedEvent.id,
        organizer: {
            _id: updatedEvent.organizer.id,
            name: updatedEvent.organizer.name,
            email: updatedEvent.organizer.email
        }
    };
};

const deleteEvent = async (eventId) => {
    try {
        const deleted = await prisma.event.delete({
            where: { id: eventId }
        });
        return {
            ...deleted,
            _id: deleted.id
        };
    } catch (err) {
        return null;
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
};