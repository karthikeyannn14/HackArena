const prisma = require("../config/prisma");

const authorizeEventOwner = async (req, res, next) => {
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.id }
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        // Admins can manage any event
        if (req.user.role === "ADMIN") {
            req.event = event;
            return next();
        }

        // Organizers can manage only their own events
        if (event.organizerId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to manage this event",
            });
        }

        req.event = event;
        next();
    } catch (error) {
        console.error("Event authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = authorizeEventOwner;