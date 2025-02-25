const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// API to get tasks

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nzugd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server
    // await client.connect();

    // Define collections
    const projects = client.db("task-ManagementDB").collection("projects");
    const tasks = client.db("task-ManagementDB").collection("tasks"); // ✅ Define it once

    // POST: Add a new project
    app.post("/projects", async (req, res) => {
      try {
        const { name, email } = req.body;
        if (!name)
          return res.status(400).json({ message: "Project name is required" });

        const newProject = { name, email, createdAt: new Date() };
        const result = await projects.insertOne(newProject);

        res
          .status(201)
          .json({ message: "Project added", projectId: result.insertedId });
      } catch (error) {
        console.error("Error adding project:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
    // GET: Fetch all Project
    app.get("/projects", async (req, res) => {
      const email = req.query.email;
      try {
        const query = { email };

        const allProjects = await projects.find(query).toArray();
        res.json(allProjects);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // ✅ FIX: Don't redeclare `tasks` inside routes

    // GET: Fetch all tasks
    app.get("/alltasks", async (req, res) => {
      try {
        const allTasks = await tasks.find().toArray();
        res.json(allTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // GET: Fetch tasks for a selected project
    app.get("/tasks/:project", async (req, res) => {
      const email = req.query.email;

      try {
        const { project } = req.params; // ✅ Use req.query instead of req.body
        if (!project)
          return res.status(400).json({ message: "Project is required" });

        const query = { project, email };
        const projectTasks = await tasks.find(query).toArray();
        res.json(projectTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // POST: Add a new task
    app.post("/tasks", async (req, res) => {
      try {
        const newTask = req.body;
        const result = await tasks.insertOne(newTask);
        res.json(result);
      } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // PUT: Update a task's category & position
    app.put("/tasks/:id", async (req, res) => {
      const { id } = req.params;
      console.log("id", id);
      const { category, title, description, position } = req.body;
      console.log("id", id, category, position);

      try {
        const result = await tasks.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              category,
              title,
              description,
              position,
              updatedAt: new Date(),
            },
          }
        );
        console.log(result);
        if (result.modifiedCount === 1) {
          console.log("success");
          res.json({ success: true, message: "Task updated" });
        } else {
          res.status(404).json({ success: false, message: "Task not found" });
        }
      } catch (error) {
        console.error("Error updating task:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.put("/tasks/update-order", async (req, res) => {
      try {
        const { tasks } = req.body;

        // Loop through and update each task's position and category
        for (const task of tasks) {
          await TaskModel.findByIdAndUpdate(task._id, {
            category: task.category,
            position: task.position,
          });
        }

        res.status(200).json({ message: "Task order updated successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to update task order" });
      }
    });

    // DELETE: Remove a task
    app.delete("/tasks/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await tasks.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // Ping MongoDB to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
