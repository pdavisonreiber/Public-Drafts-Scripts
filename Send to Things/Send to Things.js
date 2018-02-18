// Array of Projects or Area names. Names should be unique.
var presetProjects = ["School", "Teaching", "IT", "CPD", "Maths Society"]

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
		task.title = draft.processTemplate("[[title]]")
		task.notes = draft.processTemplate("[[body]]")
	} else if (location == "Today") {
		var task = TJSTodo.create()
		task.title = draft.processTemplate("[[title]]")
		task.notes = draft.processTemplate("[[body]]")
		task.when = "today"
	} else if (location == "Project") {
		var taskPrompt = Prompt.create()
		taskPrompt.title = "Select Project"
		taskPrompt.addSelect("projectChoice", "Preset Projects", presetProjects.concat(["Other"]), ["Other"], false) 
		taskPrompt.addTextField("otherProject", "", "", {placeholder: "Other Project", autocorrect: true, autocapitalization: "words"})
		taskPrompt.addTextField("heading", "Heading", "", {placeholder: "optional", autocorrect: true, autocapitalization: "words"})
		
		taskPrompt.addTextField("tags", "Tags", "", {placeholder: "tag1, tag2, ...", autocorrect: true})
		
		taskPrompt.addButton("OK")
		var didSelectProject = taskPrompt.show()
		
		if (!didSelectProject) {
			context.cancel()
		} else {
			var datePrompt = Prompt.create()
			datePrompt.title = "Dates"
			
			var today = new Date()
			datePrompt.addSwitch("hasDate", "Add Date", false)
			datePrompt.addDatePicker("date", "Date", today, {mode: "date"})
			
			datePrompt.addSwitch("hasDeadline", "Add Deadline", false)
			datePrompt.addDatePicker("deadline", "Deadline", today, {mode: "date"})
			
			datePrompt.addButton("OK")
			
			var didSelectDate = datePrompt.show()
			
			if (!didSelectDate) {
				context.cancel()
			} else {
				var projectChoice = taskPrompt.fieldValues.projectChoice
				var otherProject = taskPrompt.fieldValues.otherProject
				var heading = taskPrompt.fieldValues.heading
				var tags = taskPrompt.fieldValues.tags.split(", ")
				
				var hasDate = datePrompt.fieldValues.hasDate
				var date = datePrompt.fieldValues.date
				var hasDeadline = datePrompt.fieldValues.hasDeadline
				var deadline = datePrompt.fieldValues.deadline
				var task = TJSTodo.create()
				task.title = draft.processTemplate("[[title]]")
				task.notes = draft.processTemplate("[[body]]")
				if (hasDate) {
					task.when = date
				}
				if (hasDeadline) {
					task.deadline = deadline
				}
				if (projectChoice == "Other") {
					task.list = otherProject
				} else {
					task.list = projectChoice
				}
				task.tags = tags
				task.heading = heading
			}
		}
	}
}

var container = TJSContainer.create([task])
var cb = CallbackURL.create()
cb.baseURL = container.url
var success = cb.open()
if (success) {
	console.log("Task created in Things");
}
else {
	context.fail();
}