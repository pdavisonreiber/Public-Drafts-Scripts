// Enter default alarm time for reminders in the form 15:32.
const defaultTime = "12:00";

// Change to "GB" to interpret dates assuming dd/mm/yy format.
const locale = "US";

const listRegex = /\/((\w| )+)/;

function makeReminder(string) {
	
	var workingString = string;
	const dueDateStringExists = chrono.parse(string).length > 0;
	
	if (dueDateStringExists) {
		switch(locale) {
		case "US":
			var result = chrono.parse(workingString)[0];
			break;
		case "GB":
			var result = chrono.en_GB.parse(workingString)[0];
			break
		}
		
		console.log(JSON.stringify(result));
		workingString = workingString.replace(result.text, "")
	}
	
	const allReminderLists = ReminderList.getAllReminderLists();
	const listStringExists = listRegex.test(workingString);
	const listString = listStringExists ? listRegex.exec(workingString)[1].trim() : "";
	var matchingLists = [];
	for (let someList of allReminderLists) {
		let findList = new RegExp("^" + listString, "i");
		if (findList.test(someList.title)) {
			matchingLists.push(someList)
		}
	}

workingString = workingString.replace("/"+ listString, "");


	if (workingString.includes("!!!")) {
		var priorityLevel = 1
	} else if (workingString.includes("!!")) {
		var priorityLevel = 5
	} else if (workingString.includes("!")) {
		var priorityLevel = 9
	} else {
		var priorityLevel = 0
	}
	
	workingString = workingString.replace(/\!/g, "");
	
	const titleString = workingString.trim();

	if (!titleString) { return }
	
	if (listStringExists) {
		if (ReminderList.find(listString)) {
			var list = ReminderList.find(listString)
		} else if (matchingLists.length > 0) {
			var list = matchingLists[0]
		} else {
			var list = ReminderList.default()
		}
	} else {
		var list = ReminderList.default()
	}
	
	var reminder = list.createReminder();
	reminder.title = titleString;
	
	if (dueDateStringExists) {
		reminderDueDate = result.start.date();
		if (!result.start.knownValues.hasOwnProperty("hour")) {
			var defaultHour = parseInt(defaultTime.split(":")[0]);
			var defaultMinute = parseInt(defaultTime.split(":")[1]);
			reminderDueDate.setHours(defaultHour, defaultMinute)
		}
		reminder.dueDate = reminderDueDate;
		var alarm = Alarm.alarmWithDate(reminderDueDate);
		reminder.addAlarm(alarm)
	}
	
	reminder.priority = priorityLevel;
	
	if (!reminder.update()) {
		console.log("Error: " + reminder.lastError);
	}
	
}

function getSelectionOrDraft() {
	
	var selection = editor.getSelectedText()

	if (!selection || selection.length == 0) {
		return draft.content
	} else {
		return selection
	}
	
}

const lines = getSelectionOrDraft().split("\n");
for (let line of lines) {
	makeReminder(line)
} 