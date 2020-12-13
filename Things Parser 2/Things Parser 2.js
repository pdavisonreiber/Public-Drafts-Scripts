// Things Parser

// Delimiters can be customised, but care should be taken to escape any characters reserved by regex.
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
	}
	
	checkIfBlockHeading(parser) {
		
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
	
	parseLine(parser) {
		
		const lineStringWithSpace = " " + this.lineString
		
		const deadlineString = parser.regex.deadline.test(lineStringWithSpace) ? parser.regex.deadline.exec(lineStringWithSpace)[1] : ""
		this.deadline = deadlineString ? chrono.parse(parser.regex.deadline.exec(lineStringWithSpace)[1])[0].start.date() : null
		
		const lineMinusDeadline = this.deadline != null ? lineStringWithSpace.replace("!" + deadlineString, "") : lineStringWithSpace
	
		const parsedDates = chrono.parse(lineMinusDeadline)
		this.parsedDate = parsedDates.length > 0? parsedDates[0] : null
		this.date = parsedDates.length > 0 ? parsedDates[0].start.date() : null
		const dateString = parsedDates.length > 0 ? parsedDates[0].text : ""
		
		this.lineMinusDates = lineMinusDeadline.replace(dateString, "").trim()
		
		this.isBlockHeading = this.checkIfBlockHeading(parser)
		
		const lineMinusDatesWithSpace = " " + this.lineMinusDates
		
		this.title = this.isBlockHeading ? null : parser.regex.title.exec(lineMinusDatesWithSpace)[0].trim()
		
		this.notes = parser.regex.notes.test(lineMinusDatesWithSpace) ? parser.regex.notes.exec(lineMinusDatesWithSpace)[1].trim() : ""
		
		this.checklist = new Array()
		var match = parser.regex.checklist.exec(lineMinusDatesWithSpace)
		while (match != null) {
			this.checklist.push(match[1].trim())
			match = parser.regex.checklist.exec(lineMinusDatesWithSpace)
		}
			
		this.tags = new Array() 
		var match = parser.regex.tags.exec(lineMinusDatesWithSpace)
		while (match != null) {
			this.tags.push(match[1].trim())
			match = parser.regex.tags.exec(lineMinusDatesWithSpace)
		}
		
		this.project = parser.regex.project.test(lineMinusDatesWithSpace) ? parser.regex.project.exec(lineMinusDatesWithSpace)[1].trim() : ""
		
		this.newProject = parser.regex.newProject.test(lineMinusDatesWithSpace) ? parser.regex.newProject.exec(lineMinusDatesWithSpace)[1].trim() : ""
		
		this.heading = parser.regex.heading.test(lineMinusDatesWithSpace) ? parser.regex.heading.exec(lineMinusDatesWithSpace)[1].trim() : ""
		
		this.headings = new Array()
		var match = parser.regex.headings.exec(lineMinusDatesWithSpace)
		while (match != null) {
			this.headings.push(match[1].trim())
			match = parser.regex.headings.exec(lineMinusDatesWithSpace)
		}
	}
	
	get hasReminder() {
		return this.parsedDate ? this.parsedDate.start.knownValues.hasOwnProperty("hour") : false
	}
	
	convertToTask() {
		
		function thingsDateFormat(date, includeTime) {
			if (includeTime) {
				return moment(date).format("YYYY-MM-DD@HH:mm")
			} else {
				return moment(date).format("YYYY-MM-DD")
			}
		}
		
		var task = TJSTodo.create()
		task.title = this.title
		task.when = thingsDateFormat(this.date, this.hasReminder)
		task.deadline = thingsDateFormat(this.deadline, false)
		task.notes = this.notes
		
		for (var item of this.checklist) {
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

		if (this.blockHeading && !this.blockHeading.newProject) {
			if (!line.date && this.blockHeading.date) {
				lineWithInheritedProperties.date = this.blockHeading.date
			}
			if (!line.deadline && this.blockHeading.deadline) {
				lineWithInheritedProperties.deadline = this.blockHeading.deadline
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
		
	}
	
	createNewProjectForSingleLine(line) {
		
		console.assert(line.newProject)
		var myTJSProject = TJSProject.create()
		myTJSProject.title = line.newProject
		myTJSProject.area = line.project
		
		if (line.heading) {
			var myTJSHeading = TJSHeading.create()
			myTJSHeading.title = line.heading
			myTJSProject.addHeading(myTJSHeading)
		}
		
		myTJSProject.addTodo(line.convertToTask())
		
		return myTJSProject
	}
	
	processHeadings(lines) {
		
		var headings = new Array()
		headings[0] = "nullHeading"
		
		var mapping = new Object()
		mapping["nullHeading"] = new Array()
		
		var match = parser.regex.headings.exec(this.blockHeading.lineString)
		while (match != null) {
				var heading = match[1].trim()
				headings.push(heading)
				mapping[heading] = new Array()
				match = parser.regex.headings.exec(this.blockHeading.lineString)
		}
		
		for (let line of lines) {
			if (!line.heading) {
				mapping["nullHeading"].push(line)
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
		
		var blockHeadingTask = this.blockHeading.convertToTask()
		myTJSProject.notes = blockHeadingTask.notes
		myTJSProject.when = blockHeadingTask.when
		myTJSProject.deadline = blockHeadingTask.deadline
		myTJSProject.area = blockHeadingTask.list
		myTJSProject.tags = blockHeadingTask.tags
		
		const linesWithOwnNewProject = this.lines.filter(line => line.newProject != "")
		const linesWithoutOwnNewProject = this.lines.filter(line => !line.newProject)
		
		for (let line of linesWithOwnNewProject) {
			myTJSProjects.push(this.createNewProjectForSingleLine(line))
		}
		
		var processedHeadings = this.processHeadings(linesWithoutOwnNewProject)
		var headings = processedHeadings.headings
		var headingsMapping = processedHeadings.headingsMapping
		
		for (let line of headingsMapping["nullHeading"]) {
			var myTJSTodo = line.convertToTask()
			myTJSProject.addTodo(myTJSTodo)
		}
		
		headings.shift()
		
		for (let heading of headings) {
			
			var myTJSHeading = TJSHeading.create()
			myTJSHeading.title = heading
			myTJSProject.addHeading(myTJSHeading)
			
			for (let line of headingsMapping[heading]) {
				myTJSTodo = line.convertToTask()
				myTJSProject.addTodo(myTJSTodo)
			}
		}
		
		myTJSProjects.push(myTJSProject)
		
		return myTJSProjects
	}
	
	makeTasksAndProjects() {
		
		var TJSTodos = new Array()
		var TJSProjects = new Array()
		
		if (this.blockHeading && this.blockHeading.newProject) {
			return this.createNewProjects()
		} else {
			for (var line of this.lines) {
				if (line.newProject) {
					TJSProjects.push(this.createNewProjectForSingleLine(line))
				} else {
					TJSTodos.push(line.convertToTask())
				}
			}
		
		}
		
		return TJSTodos.concat(TJSProjects)
		
	}
	
}

class Parser {
	
	constructor(delimiters) {
		this._delimiters = new Object()
		this.regex = new Object()
		this.delimiters = delimiters
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
		
		const regexMaker = (delimiterType, flag) => new RegExp(" " + delimiterType + "((.(?! " + listOfDelimiters + "))*\\S)", flag)
		
		this.regex.tags = regexMaker(value.tags, "g")
		this.regex.project = regexMaker(value.project)
		this.regex.newProject = regexMaker(value.newProject)
		this.regex.notes = regexMaker(value.notes)
		this.regex.heading = regexMaker(value.heading)
		this.regex.headings = regexMaker(value.heading, "g")
		this.regex.deadline = regexMaker(value.deadline)
		this.regex.checklist = regexMaker(value.checklist, "g")
		
		this.regex.title = new RegExp("^(.(?! " + listOfDelimiters + "))*\\S")
		
	}
	
	get delimiters() {
		return this._delimiters
	}
	
	processText(text) {
		
		function notJustWhitespace(string) {
			const notJustWhitespaceRegex = /\S/
			return notJustWhitespaceRegex.test(string)
		} 
		
		var paragraphs = text.split("\n\n")
		
		for (let paragraph of paragraphs) {
			
			var block = new Block()
			var sentences = paragraph.split("\n")
		
			for (let sentence of sentences) {
				
				if (notJustWhitespace(sentence)) {
					var line = new Line(sentence)
					line.parseLine(this)
					block.addLine(line)
				}
			}
			
			this.blocks.push(block)
			
		}
		
	}
	
	sendToThings() {
		
		var items = new Array()
		
		for (var block of this.blocks) {
			console.log("block: " + JSON.stringify(block))
			items = items.concat(block.makeTasksAndProjects())
		}
		
		var myTJSContainer = TJSContainer.create(items)
		
		var callback = CallbackURL.create()
		callback.baseURL = myTJSContainer.url
	
		var success = callback.open()
		
		if (success) { 
			console.log("Success") 
		} else { 
			context.fail() 
		}
		
	}

}

parser = new Parser(delimiters)
parser.processText(draft.content)
parser.sendToThings()






