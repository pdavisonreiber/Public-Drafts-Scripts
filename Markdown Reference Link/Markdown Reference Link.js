/* 
If no text is selected:
- add reference link template [][1] at current cursor position
- add reference [1]: at end of document, with link if clipboard contains URL 
- move cursor to inside of [] for entering URL text

If text is selected:
- replace selection with [selection][1]
- add reference [1]: at end of document, with link if clipboard contains URL
- move cursor to after [selection][1] if link was added, or after reference [1]: if no link was added

Script automatically increments reference number for each new link.

*/

// helper to test for URL
function isUrl(s) {
   var urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
   return urlRegex.test(s);
}

// helper to check current highest link number and return next available number
function nextLinkNumber() {
	var lines = editor.getText().split("\n")
	var lastLine = lines.pop()
	// Ignore whitespace after final line of document
	nonWhitespaceRegex = /\S/ 
	while (!nonWhitespaceRegex.test(lastLine)){
		lastLine = lines.pop()
	}	
	var refRegex = /\[(\d)\]/
	var existingLink = refRegex.test(lastLine)
	if (existingLink == false){
		return 1
	} else {
		var currentLinkNumber = parseInt(refRegex.exec(lastLine)[1])
		return currentLinkNumber + 1
	}
}

var selection = editor.getSelectedText()
var selectedRange = editor.getSelectedRange()
var refLinkNumber = nextLinkNumber()

// Get URL from clipboard if there is one
var clip = app.getClipboard()
var link = ""
if (isUrl(clip)) {
  link = clip
}

// Add additional new line character if first reference, otherwise add to next line
if (refLinkNumber == 1) {
	var refLink = "\n\n[" + refLinkNumber + "]: " + link
} else {
	var refLink = "\n[" + refLinkNumber + "]: " + link
}

// If no text is selected
if (selection.length == 0) {
	// Add reference link at current cursor position
	editor.setSelectedText("[][" + refLinkNumber + "] ")
	// Add reference to end of document
	editor.setText(editor.getText() + refLink)
	// Move cursor to centre of [] in reference link in text
	editor.setSelectedRange(selectedRange[0] + 1, 0)
} else {
	// Replace currently selected text with reference link
	editor.setSelectedText("[" + selection + "][" + refLinkNumber + "]")
	editor.setText(editor.getText() + refLink)
	// Add reference to end of document
	if (isUrl(clip)) {
		// If URL was added, move cursor back to after reference link in text
		editor.setSelectedRange(selectedRange[0] + selectedRange[1] + 5, 0)
	} else {
		// If no URL was added, move cursor to URL position in reference at end of document
		editor.setSelectedRange(editor.getText().length, 0)
	}
}