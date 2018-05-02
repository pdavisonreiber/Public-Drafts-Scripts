// OmniOutliner OPML to Markdown
var inputDraft = draft

var prompt = Prompt.create()
prompt.title = "Heading Depth"
prompt.message = "Enter the highest level of Markdown heading that you would like to appear in the draft."
prompt.addTextField("headingLevel", "", "", {placeholder: "Must be at least 2", keyboard: "numberPad"})
prompt.addButton("OK")

var didSelect = prompt.show()

class Line {
	
	constructor(str) {
		if (/text=\"(.+)\"/.test(str)) {
			this.text = /text=\"(.+)\"/.exec(str)[1]
		} else {
			this.text = ""
		}
		this.styledText = ""
		this.hasChild = !str.includes("\/")
		this.isOutdentLine = str.includes("\/outline")
		this.level = 0
		this.isHeading = false
		
	}

	setLevel(precedingLine) {
		if (precedingLine.hasChild) {
			this.level = precedingLine.level + 1
		} else if (precedingLine.isOutdentLine) {
			this.level = precedingLine.level - 1
		} else {
			this.level = precedingLine.level
		}
	}

	static styleText(line, headingDepth) {
		if (line.level == 0) {
			line.styledText = "\n\n\n" + "## " + line.text + "\n"
		} else if (line.level <= headingDepth) {
			line.styledText = "\n" + "#".repeat(line.level + 2) + " " + line.text + "\n"
			line.isHeading = true
		} else if (line.text != "") {
			line.styledText = "\t".repeat(line.level - headingDepth - 1) + "- " + line.text
		}
	}
}

if (didSelect) {
	var headingDepth = prompt.fieldValues.headingLevel - 2
	if (headingDepth >= 0) {
		processDraft(headingDepth)
	} else {
		context.fail("Please enter a number greater than or equal to 2")
	}
} else {
	context.cancel()
}

function processDraft(headingDepth) {
	strs = inputDraft.content.split("\n")
	lines = new Array()
	
	for (index = 0; index < strs.length - 1; index++) {
		if (strs[index].includes("outline")) {
			lines.push(new Line(strs[index]))
		}
	}
	
	outputDraft = Draft.create()
	outputDraft.content += "# "+ /<title>(.+)<\/title>/.exec(inputDraft.content)[1]
	
	for (index = 0; index < lines.length; index++) {
		
		if (index > 0) {
			lines[index].setLevel(lines[index - 1])
		}
		
		Line.styleText(lines[index], headingDepth)
		
		if (lines[index].text != "") {
			outputDraft.content += lines[index].styledText + "\n"
		}
	}
	
	outputDraft.content = outputDraft.content.replace(/\n\n\n/g, "\n\n").trim()
	
	outputDraft.update()
	editor.load(outputDraft)
}