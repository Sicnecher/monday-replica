import { useState } from "react"

export function AddTask({ group, handleAddTask }) {

    const [newTaskTitle, setNewTaskTitle] = useState("")

    function onAddTask() {
        if (newTaskTitle !== '')
            handleAddTask(group, newTaskTitle)
    }

    function handleKeyDown(event) {
        if (event.key === "Enter")
            onAddTask()
    }

    return (
        <section className="add-task">
            <input
                className="add-input"
                style={{ borderLeft: `5px solid ${group?.color}`, borderBottomLeftRadius: 5 }}
                onBlur={onAddTask}
                onKeyDown={handleKeyDown}
                type="text"
                placeholder="+Add Task"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
            />
        </section>
    )
}