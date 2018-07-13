// Change to "GB" to interpret dates assuming dd/mm/yy format.
const locale = "US";

const locationRegex = /(?: at | in )(.+)/;
const calendarRegex = /\/(\w+)/;
const alertRegex = /alert (\d+)(?: *)(minutes|minute|mins|min|m|hours|hour|hrs|hr|h)/;
const durationRegex = /(\d+)(?: *)(minutes|minute|mins|min|m|hours|hour|hrs|hr|h)/;

function makeEvent(string) {
	
	var workingString = string;

	if (chrono.parse(string).length == 0) {
		workingString = workingString + " today";
	}
	
	console.log(JSON.stringify(result));
	switch(locale) {
		case "US":
			var result = chrono.parse(workingString)[0];
			break;
		case "GB":
			var result = chrono.en_GB.parse(workingString)[0];
			break
	}
	
	workingString = workingString.replace(result.text, "");
	
	const allCalendars = Calendar.getAllCalendars();
	const calendarStringExists = calendarRegex.test(workingString);
	const calendarString = calendarStringExists ? calendarRegex.exec(workingString)[1].trim() : "";
	var matchingCalendars = [];
	for (let someCalendar of allCalendars) {
		let findCal = new RegExp("^" + calendarString, "i");
		if (findCal.test(someCalendar.title)) {
			matchingCalendars.push(someCalendar)
		}
	}
	

	workingString = workingString.replace("/"+ calendarString, "");

	const alertStringExists = alertRegex.test(workingString);
	const alertStrings = alertStringExists ? alertRegex.exec(workingString) : "";
	const alertQuantity = alertStringExists ? alertStrings[1] : null;
	const alertUnits = alertStringExists ? alertStrings[2] : null;
	switch(alertUnits) {
		case "m":
		case "min":
		case "mins":
		case "minute":
		case "minutes":
			var alertMultiplier = 1;
			break;
		case "h":
		case "hr":
		case "hrs":
		case "hour":
		case "hours":
			var alertMultiplier = 60;
			break;
		default:
			var alertMultiplier = 1;
			break;
	}
	
	if (alertStringExists) {
		var alert = alertQuantity * alertMultiplier;
		workingString = workingString.replace(alertStrings[0], "");
	}
	
	const durationStringExists = durationRegex.test(workingString);
	const durationStrings = durationStringExists ? durationRegex.exec(workingString) : "";
	
	const durationQuantity = durationStringExists ? durationStrings[1] : null;
	const durationUnits = durationStringExists ? durationStrings[2] : null;
	switch(durationUnits) {
		case "m":
		case "min":
		case "mins":
		case "minute":
		case "minutes":
			var durationMultiplier = 1;
			break;
		case "h":
		case "hr":
		case "hrs":
		case "hour":
		case "hours":
			var durationMultiplier = 60;
			break;
		default:
			var durationMultiplier = 1;
			break;
	}
	
	if (durationStringExists) {
		var duration = durationQuantity * durationMultiplier;
		workingString = workingString.replace(durationStrings[0], "")
	}
	
	const locationStringExists = locationRegex.test(workingString);
	const locationStrings = locationStringExists ? locationRegex.exec(workingString) : "";
	
	workingString = workingString.replace(locationStrings[0], "");
	
	const titleString = workingString.trim();

	if (!titleString) { return }
	
	if (calendarStringExists) {
		if (Calendar.find(calendarString)) {
			var calendar = Calendar.find(calendarString)
		} else if (matchingCalendars.length > 0) {
			var calendar = matchingCalendars[0]
		} else {
			var calendar = Calendar.default()
		}
	} else {
		var calendar = Calendar.default()
	}
	
	
	var event = calendar.createEvent();
	event.title = titleString;
	event.startDate = result.start.date();
	
	if (durationStringExists) {
		event.endDate = new Date(event.startDate.getTime() + duration * 60 * 1000)
	}
	else if (result.hasOwnProperty("end")) {
		event.endDate = result.end.date()
	} else {
		event.endDate = new Date(event.startDate.getTime() + 60 * 60 * 1000)
	}
	
	if (!result.start.knownValues.hasOwnProperty("hour")) {
		event.isAllDay = true
	}
	
	if (alertStringExists) {
		var alarm = Alarm.alarmWithOffset(-60*alert);
		event.addAlarm(alarm)
	}
	
	if (locationStringExists) {
		event.location = locationStrings[1]
	}
	
	if (!event.update()) {
		console.log("Error: " + event.lastError);
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
	makeEvent(line)
} 