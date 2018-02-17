// Dictionary of Projects or Areas Names with ids e.g. {"Name of Project": "id"}
var presetProjects = {}

// Prompt to select where task will go.
var targetPrompt = Prompt.create()

targetPrompt.title = "Task Location"
targetPrompt.addButton("Inbox")
targetPrompt.addButton("Today")
targetPrompt.addButton("Project")
targetPrompt.addButton("Convert to Project")

var didSelectTarget = targetPrompt.show()

if (!didSelectTarget) {
	context.cancel()
} else {
	var location = targetPrompt.buttonPressed
	if (location == "Inbox") {
		var task = TJSTodo.create()
		task.title = draft.title
		task.notes = draft.body
	} else if (location == "Today") {
		var task = TJSTodo.create()
		task.title = draft.title
		task.notes = draft.body
		task.when = "today"
	} else if (location == "Project") {
		
		var taskPrompt = Prompt.create()
		taskPrompt.title = "Task Details"
		
		var presetProjectNames = Object.keys(presetProjects)
		taskPrompt.addSelect("projectChoice", "Preset Projects", presetProjectNames.concat(["Other Project"]), "Other Project", false) 
		taskPrompt.addTextField("otherProject", "Other Project", "", {placeholder: "Project Name", autocorrect: true, autocapitalization: "words"})
		taskPrompt.addTextField("heading", "Heading", "", {placeholder: "optional", autocorrect: true, autocapitalization: "words"})
		
		var today = new Date()
		taskPrompt.addSwitch("hasDate", "Date", false)
		taskPrompt.addDatePicker("date", "Date", today, {mode: "date"})
		taskPrompt.addSwitch("hasDeadline", "Deadline", false)
		taskPrompt.addDatePicker("deadline", "Deadline", today, {mode: "date"})
		
		taskPrompt.addTextField("tags", "Tags", "", {placeholder: "optional", autocorrect: true})
		
		taskPrompt.addButton("OK")
		
		var didSelectProject = taskPrompt.show()
		
		if (!didSelectProject) {
			context.cancel()
		} else {
		
			var projectChoice = taskPrompt.fieldValues.projectChoice
			var otherProject = taskPrompt.fieldValues.otherProject
			var heading = taskPrompt.fieldValues.heading
			var hasDate = taskPrompt.fieldValues.hasDate
			var date = taskPrompt.fieldValues.date
			var hasDeadline = taskPrompt.fieldValues.hasDeadline
			var deadline = taskPrompt.fieldValues.deadline
			var tags = taskPrompt.fieldValues.tags.split(", ")
			
			var task = TJSTodo.create()
			task.title = draft.title
			task.notes = draft.body
			if (hasDate) {
				task.when = date
			}
			if (hasDeadline) {
				task.deadline = deadline
			}
			if (projectChoice == "Other Project") {
				task.list = otherProject
			} else {
				task.list = projectChoice
			}
			task.tags = tags
			task.heading = heading
			
		}
	}
}

var container = TJSContainer.create(task)
var cb = CallbackURL.create()
cb.baseURL = container.url
var success = cb.open()
if (success) {
	console.log("Task created in Things");
}
else {
	context.fail();
}