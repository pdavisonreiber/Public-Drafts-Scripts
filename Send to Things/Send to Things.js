// Array of Projects or Area names. Names should be unique.
var presetProjects = ["School", "Teaching", "IT", "CPD", "Maths Society"]
var presetAreas = ["School", "Personal", "Hobbies"]

function dateNoTime(date) {
	dateRegex = /\w{3} \w{3} \d{2}\ \d{4}/
	console.log(dateRegex.exec(date))
	return dateRegex.exec(date)
}

// Prompt to select where task will go.
var targetPrompt = Prompt.create()

targetPrompt.title = "Task Location"
targetPrompt.addButton("Inbox")
targetPrompt.addButton("Today")
targetPrompt.addButton("Existing Project")
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
		
	} else if (location == "Existing Project") {
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
					task.when = dateNoTime(date)
				}
				if (hasDeadline) {
					task.deadline = dateNoTime(deadline)
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
	} else if (location == "Convert to Project") {
		var projectPrompt = Prompt.create()
		projectPrompt.title = "Select Area"
		projectPrompt.addSelect("areaChoice", "Preset Areas", presetAreas.concat(["Other"]), ["Other"], false) 
		projectPrompt.addTextField("otherArea", "", "", {placeholder: "Other Area", autocorrect: true, autocapitalization: "words"})
		projectPrompt.addTextField("tags", "Tags", "", {placeholder: "tag1, tag2, ...", autocorrect: true})
		projectPrompt.addButton("OK")
		
		didSelectArea = projectPrompt.show()
		if (!didSelectArea) {
			context.cancel()
		} else  {
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
				var areaChoice = projectPrompt.fieldValues.areaChoice
				var otherArea = projectPrompt.fieldValues.otherArea
				var hasDate = datePrompt.fieldValues.hasDate
				var date = datePrompt.fieldValues.date
				var hasDeadline = datePrompt.fieldValues.hasDeadline
				var deadline = datePrompt.fieldValues.deadline
				var task = TJSProject.create() 
				task.title = draft.processTemplate("[[title]]")
				task.notes = draft.processTemplate("[[body]]")
				if (hasDate) {
					task.when = date
				}
				if (hasDeadline) {
					task.deadline = deadline
				}
				if (areaChoice == "Other") {
					task.area = otherArea
				} else {
					task.area = areaChoice
				}
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