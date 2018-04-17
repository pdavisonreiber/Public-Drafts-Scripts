const delimiters = {
	tags: "@",
	project: "#",
	newProject: "\\+",
	notes: "\/\/",
	heading: "\\=\\=",
	deadline: "\\!",
	checklist: "\\*"
}

class Line {
	
	constructor(lineString) {
		this.lineString = lineString
		this.deadline = null
		this.date = null
		this.hasReminder = false
		this.notes = ""
		this.checklist = new Array()
		this.tags = new Array()
		this.project = ""
		this.newProject = ""
		this.heading = ""
		this.headings = new Array()
		this.isBlockHeading = false
	}
	
	isBlockHeading(parser) {
		
		const isOnlyDates = (this.lineMinusDates == "")
		const beginsWithDelimiter = (
			this.lineMinusDates.startsWith(parser.delimiters.tags.replace("\\", "")) || 
			this.lineMinusDates.startsWith(parser.delimiters.project.replace("\\", "")) || 
			this.lineMinusDates.startsWith(parser.delimiters.newProject.replace("\\", "")) || 
			this.lineMinusDates.startsWith(parser.delimiters.notes.replace("\\", "")) || 
			this.lineMinusDates.startsWith(parser.delimiters.heading.replace("\\", "")) || 
			this.lineMinusDates.startsWith(parser.delimiters.deadline.replace("\\", "")) || 
			this.lineMinusDates.startsWith(parser.delimiters.checklist.replace("\\", ""))
		)
		
		return isOnlyDates || beginsWithDelimiter
		
	}
	
	parse(parser) {
		
		const deadlineString = parser.regex.deadline.test(this.lineString) ? parser.regex.deadline.exec(this.lineString)[1] : ""
		this.deadline = deadlineString ? chrono.parse(parser.regex.deadline.exec(lineString)[1])[0].start.date() : null
		
		const lineMinusDeadline = this.deadline != null ? this.lineString.replace("!" + deadlineString, "") : this.lineString
	
		const parsedDates = chrono.parse(lineMinusDeadline)
		this.date = parsedDates.length > 0 ? parsedDates[0].start.date() : null
		const dateString = parsedDates.length > 0 ? parsedDates[0].text : ""
		
		this.hasReminder = parsedDates.length > 0 ?  parsedDates[0].start.knownValues.hasOwnProperty("hour") : false
		
		this.lineMinusDates = lineMinusDeadline.replace(dateString, "").trim()
		
		this.title = this.isBlockHeading(parser) ? null : parser.regex.title.exec(this.lineMinusDates)[0].trim()
		
		this.notes = parser.regex.notes.test(this.lineMinusDates) ? parser.regex.notes.exec(this.lineMinusDates)[1].trim() : ""
		
		while ((match = parser.regex.checklist.exec(this.lineMinusDates)) != null) {
			this.checklist.push(match[1].trim())
		}
		
		while ((match = parser.regex.tags.exec(this.lineMinusDates)) != null) {
			this.tags.push(match[1].trim())
		}
		
		this.project = parser.regex.project.test(this.lineMinusDates) ? parser.regex.project.exec(this.lineMinusDates)[1].trim() : ""
		
		this.newProject = parser.regex.newProject.test(this.lineMinusDates) ? parser.regex.newProject.exec(this.lineMinusDates)[1].trim() : ""
		
		this.heading = parser.regex.heading.test(this.lineMinusDates) ? parser.regex.heading.exec(this.lineMinusDates)[1].trim() : ""
		
		while ((match = parser.regex.headings.exec(this.lineMinusDates)) != null) {
			this.headings.push(match[1].trim())
		}
	}
	
	convertToTask() {
		
		function thingsDateFormat(date, includeTime) {
			if (includeTime) {
				return moment(date).format("YYYY-MM-DD@HH:mm")
			} else {
				return moment(date).format("YYYY-MM-DD")
			}
		}
		
		task = TJSTodo.create()
		task.title = this.title
		task.when = thingsDateFormat(this.date, this.hasReminder)
		task.deadline = thingsDateFormat(this.deadline, false)
		task.notes = this.notes
		
		for (let item of this.checklist) {
			var checklistItem = TJSChecklistItem.create()
			checklistItem.title = item
			task.addChecklistItem(checklistItem)
		}
		
		task.tags = this.tags
		task.list = this.project
		task.heading = this.heading
		
		return task
	}
	
}

class Block {
	
	constructor() {
		this._lines = new Array()
		this.tasks = new Array()
		this.projects = new Array()
	}
	
	get todoObjects() {
		return this.projects.concat(this.tasks)
	}
	
	get blockHeading() {
		if (this._lines[0] && this._lines[0].isBlockHeading) { return this._lines[0] }
		else { return null }
	}
	
	get lines() {
		if (this.blockHeading) { return this._lines.slice(1) }
		else { return this._lines }
	}
	
	addLine(line) {
		
		var lineWithInheritedProperties = line

		if (this.blockHeading) {
			if (!line.date && this.blockHeading.date) {
				lineWithInheritedProperties.date = this.blockHeading.date
			}
			if (!line.deadline && this.blockHeading.deadline) {
				lineWithInheritedProperties.deadline = this.blockHeading.deadline
			}
			if (!line.hasReminder && this.blockHeading.hasReminder) {
				lineWithInheritedProperties.hasReminder = this.blockHeading.hasReminder
			}
			if (!line.notes && this.blockHeading.notes) {
				lineWithInheritedProperties.notes = this.blockHeading.notes
			}
			if (line.checklist.length == 0 && this.blockHeading.checklist.length != 0) {
				lineWithInheritedProperties.checklist = this.blockHeading.checklist
			}
			if (line.tags.length == 0 && this.blockHeading.tags.length != 0) {
				lineWithInheritedProperties.tags = this.blockHeading.tags
			}
			if (!line.project && this.blockHeading.project) {
				lineWithInheritedProperties.project = this.blockHeading.project
			}
			if (!line.heading && this.blockHeading.heading && this.blockHeading.headings.length == 1) {
				lineWithInheritedProperties.heading = this.blockHeading.heading
			}
		}
		
		this._lines.push(lineWithInheritedProperties)
		console.log(JSON.stringify(lineWithInheritedProperties))
		
	}
	
	createNewProjectForSingleLine(line) {
		
		console.assert(line.newProject)
		var myTJSProject = TJSProject.create()
		myTJSProject.title = line.newProject
		
		if (line.heading) {
			myTJSHeading = TJSHeading.create()
			myTJSHeading.title = line.heading
			myTJSProject.addHeading(myTJSHeading)
		}
		
		myTJSProject.addTodo(line.convertToTask())
		
		return myTJSProject
	}
	
	processHeadings(lines) {
		
		var headings = new Array()
		headings[0] = null
		
		var mapping = new Object()
		mapping[null] = new Array()
		
		while ((match = headingsRegex.exec(this.blockHeading.lineString)) != null) {
				let heading = match[1].trim()
				headings.push(headingTitle)
				mapping[heading] = new Array()
		}
		
		for (let line of lines) {
			if (!line.newProject) {
				break
			} else if (!line.heading) {
				mapping[null].push(line)
			} else {
				mapping[line.heading].push(line)
			}
		}
		
		return {"headings": headings, "headingsMapping": mapping}
		
	}
	
	createNewProjects() {
		
		console.assert(this.blockHeading.newProject)
		var myTJSProjects = new Array()
		var myTJSProject = TJSProject.create()
		myTJSProject.title = this.blockHeading.newProject
		
		var blockHeadingTask = this.blockHeading().convertToTask()
		myTJSProject.notes = blockHeadingTask.notes
		myTJSProject.when = blockHeadingTask.when
		myTJSProject.deadline = blockHeadingTask.deadline
		myTJSProject.area = blockHeadingTask.list
		myTJSProject.tags = blockHeadingTask.tags
		
		function hasOwnNewProject(line) {
			return line.newProject == ""
		}
		
		linesWithOwnNewProject = this.lines.filter(hasOwnNewProject)
		linesWithoutOwnNewProject = this.lines.filter(!hasOwnNewProject)
		
		for (let line of linesWithOwnNewProject) {
			newProjects.push(createNewProjectForSingleLine(line))
		}
		
		var processedHeadings = processHeadings(linesWithoutOwnNewProject)
		var headings = processedHeadings.headings
		var headingsMapping = processedHeadings.headingsMapping
		
		for (let line of headingsMapping[null]) {
			myTJSTodo = line.convertToTask()
			myTJSProject.addTodo(myTJSTodo)
		}
		
		headings.shift()
		
		for (let heading of headings) {
			
			var myTJSHeading = TJSHeading.create()
			myTJSHeading.title = heading
			myTJSProject.addHeading(myTJSHeading)
			
			for (let lines of headingsMapping[heading]) {
				myTJSTodo = TJSTodo.create()
				myTJSProject.addTodo(myTJSTodo)
			}
		}
		
		myTJSProjects.push(myTJSProject)
		
		return myTJSProjects
	}
	
	makeTasksAndProjects() {
		
		if (blockHeading && blockHeading.newProject) {
			return createNewProjects()
		} else {
			var myTJSTasksAndProjects = new Array()
			for (let line of this.lines) {
				if (line.newProject) {
					myTJSTasksAndProjects.push(createNewProjectForSingleLine(line))
				} else {
					myTJSTasksAndProjects.push(line.convertToTask())
				}
			}
		}
		
	}
	
}

class Parser {
	
	constructor(delimiters) {
		this._delimiters = delimiters
		this.regex = new Object()
		this.blocks = new Array()
	}
	
	set delimiters(value) {
		
		this._delimiters = value
		
		const listOfDelimiters = 
			value.tags + "| " + 
			value.project + "| " + 
			value.newProject + "| " + 
			value.notes + "| " + 
			value.heading + "| " + 
			value.deadline + "| " + 
			value.checklist
		
		const regexMaker = (delimiterType, flag) => new RegExp(" " + delimiterType + "((.(?! " + listOfDelimiters + "))*\\S", flag)
		
		this.regex.tags = regexMaker(value.tags, "g")
		this.regex.project = regexMaker(value.project)
		this.regex.newProject = regexMaker(value.newProject)
		this.regex.notes = regexMaker(value.notes)
		this.regex.heading = regexMaker(value.heading)
		this.regex.headings = regexMaker(value.headings, "g")
		this.regex.deadline = regexMaker(value.deadline)
		this.regex.checklist = regexMaker(value.checklist)
		
		this.regex.title = newRegexp("^(.(?! " + listofDelimiters + "))*\\S")
		
	}
	
	get delimiters() {
		return this._delimiters
	}
	
	processText(text) {
		
		function notJustWhitespace(string) {
			notJustWhitespaceRegex = /\S/
			return notJustWhitespaceRegex.test(string)
		} 
		
		var paragraphs = text.split("\n\n")
		
		for (let paragraph of paragraphs) {
			
			var block = new Block()
			var sentences = paragraph.split("\n")
		
			for (let sentence of sentences) {
				
				if (notJustWhiteSpace(sentence) {
					var line = new Line(sentence)
					line.parse(this)
					block.addLine(line)
				}
			}
			
			this.blocks.push(block)
			
		}
		
	}
	
	sendToThings() {
		
		var items = new Array()
		
		for (let block in this.blocks) {
			items.concat(block.makeTasksAndProjects())
		}
		
		const myTJSContainer = TJSContainer.create(items)
		
		var callback = CallbackURL.create()
		callback.baseURL = container.url
	
		var success = callback.open()
		
		if (success) { console.log("Success") } 
		else { context.fail() }
	}

}

parser = new Parser(delimiters)
parser.processText(draft.content)
parser.sendToThings()

