const Task = require('../models/Task');


// CREATE TASK
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            dueDate,
            priority
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Task title is required'
            });
        }

        const task = await Task.create({
            user: req.user._id,
            title: title.trim(),
            description: description ? description.trim() : '',
            dueDate: dueDate || null,
            priority: priority || 'Medium'
        });

        res.status(201).json(task);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET ALL TASKS
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            user: req.user._id
        }).sort({
            completed: 1,
            dueDate: 1,
            createdAt: -1
        });

        res.json(tasks);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET TASK BY ID
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        if (
            task.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        res.json(task);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// UPDATE TASK
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        if (
            task.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        const {
            title,
            description,
            dueDate,
            priority
        } = req.body;

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: 'Task title cannot be empty'
                });
            }

            task.title = title.trim();
        }

        if (description !== undefined) {
            task.description = description.trim();
        }

        if (dueDate !== undefined) {
            task.dueDate = dueDate || null;
        }

        if (priority !== undefined) {
            if (!['Low', 'Medium', 'High'].includes(priority)) {
                return res.status(400).json({
                    message: 'Invalid priority'
                });
            }

            task.priority = priority;
        }

        const updatedTask = await task.save();

        res.json(updatedTask);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// TOGGLE TASK COMPLETION
const toggleTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        if (
            task.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        task.completed = !task.completed;

        if (task.completed) {
            task.completedAt = new Date();
        } else {
            task.completedAt = null;
        }

        const updatedTask = await task.save();

        res.json(updatedTask);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE TASK
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        if (
            task.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        await task.deleteOne();

        res.json({
            message: 'Task deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    toggleTask,
    deleteTask
};