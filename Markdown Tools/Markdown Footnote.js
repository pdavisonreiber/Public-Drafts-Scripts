/* 
If no text is selected:
- add footnote [^1] at current cursor position
- add reference [^1]: at end of document
- move cursor to after reference [^1]: for text entry

If text is selected:
- replace selection with [^1]
- add reference [^1]: at end of document, followed by selected text
- move cursor to after [^1] in the body of the text

Script automatically increments reference number for each new footnote.

*/

// helper to check current highest link number and return next available number
function nextLinkNumber() {
	var lines = editor.getText().split("\n")
	var lastLine = lines.pop()
	// Ignore whitespace after final line of document
	nonWhitespaceRegex = /\S/ 
	while (!nonWhitespaceRegex.test(lastLine)){
		lastLine = lines.pop()
	}	
	var refRegex = /\[\^*(\d+)\]/
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
var fnNumber = nextLinkNumber()

// Add additional new line character if first reference, otherwise add to next line
if (fnNumber == 1) {
	var fn = "\n\n[^" + fnNumber + "]: "
} else {
	var fn = "\n[^" + fnNumber + "]: "
}

// If no text is selected
if (selection.length == 0) {
	// Add reference link at current cursor position
	editor.setSelectedText("[^" + fnNumber + "]")
	// Add reference to end of document
	editor.setText(editor.getText() + fn)
	// Move cursor to end of reference
	editor.setSelectedRange(editor.getText().length, 0)
} else {
	// Replace currently selected text with footnote
	editor.setSelectedText("[^" + fnNumber + "]")
	// Add reference to end of document with selected text
	editor.setText(editor.getText() + fn + selection)

	// If selected text was moved, move cursor to after footnote in body
editor.setSelectedRange(selectedRange[0] + + 3 + fnNumber.toString().length, 0)
}