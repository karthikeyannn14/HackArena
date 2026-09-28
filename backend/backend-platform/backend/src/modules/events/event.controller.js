const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
} = require("./event.service");

const create = async (req, res) => {
    try {
        const {
            name,
            description,
            startDate,
            endDate,
            registrationStart,
            registrationEnd,
            submissionDeadline,
        } = req.body;

        if (
            !name ||
            !description ||
            !startDate ||
            !endDate ||
            !registrationStart ||
            !registrationEnd ||
            !submissionDeadline
        ) {
            return res.status(400).json({
                success: false,
                message: "All event fields are required",
            });
        }

        const event = await createEvent({
            name,
            description,
            startDate,
            endDate,
            registrationStart,
            registrationEnd,
            submissionDeadline,
            organizer: req.user.userId,
        });



        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            event,
        });
    } catch (error) {
        if (error.message === "Invalid event date configuration") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create event error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getAll = async (req, res) => {
    try {
        const events = await getEvents();

        return res.status(200).json({
            success: true,
            events,
        });
    } catch (error) {
        console.error("Get events error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getOne = async (req, res) => {
    try {
        const event = await getEventById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        return res.status(200).json({
            success: true,
            event,
        });
    } catch (error) {
        console.error("Get event error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const update = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "description",
            "startDate",
            "endDate",
            "registrationStart",
            "registrationEnd",
            "submissionDeadline",
            "status",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        const event = await updateEvent(req.params.id, updates);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event,
        });
    } catch (error) {
        if (error.message === "Invalid event date configuration") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Update event error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const remove = async (req, res) => {
    try {
        const event = await deleteEvent(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event deleted successfully",
        });
    } catch (error) {
        console.error("Delete event error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    create,
    getAll,
    getOne,
    update,
    remove,
};