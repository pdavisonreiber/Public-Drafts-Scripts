To use this as part of one of your script actions, follow these steps:
- Download this script using the install button at the bottom of the page.
- Download this [template action](https://actions.getdrafts.com/a/1Nc).
- Add your own script to the "Script" action step after the "Include Action" step.
- Get your base’s endpoint and your API key from the [Airtable API documentation](https://airtable.com/api).
- When prompted, enter these into the credential prompt. These details are stored locally on your device, and only need to be entered once for each base you access. To delete them, go to Credentials in the Drafts settings screen.

---

# Airtable

Airtable is a web-based spreadsheet and database tool which can be used to organise a large variety of different kinds of data including text, images, files, and more. The scripting interfaces below are convenience wrappers that allow easy interaction with Airtable’s REST API.

While the Airtable API offers extensive read and write access to the data stored, it does not provide metadata about the structure of databases or the types of fields. Users will need to know this information in advance to properly interact with the database.

## ATRecord
Represents a single record in an Airtable base.

### Class Functions
- **create()** -> _ATRecord_
	- Create a new record object.
- **selectRecords(Array of ATRecord objects, field, options)** -> _Array of ATRecord objects_
	- Present a list of records to the user for them to select one or more
	- **Parameters**
		- _Array of ATRecord objects_: all records must have been added to a table and the table updated.
		- _field [string]_ : a string denoting the name of the field which should be used to represent the records in the selection list.
		- _options [object]_: a dictionary of options with the following available keys.
			- **title** _[string]_ _(optional)_: Title to display in the prompt.
			- **message** _[string]_ _(optional)_: Message to display in the prompt.
			- **type** _[string]_ _(optional)_: Valid values are "selectMultiple", "selectOne", and "selectButtons".
			- **filter** _[function]_ _(optional)_: A function to filter the records displayed.

### Properties
- **id** _[string, readonly]_
	- The unique id of the record in the Airtable base. Undefined until the record is added to a table and the table is updated.
- **table** _[ATTable, readonly]_
	- The table to which the record belongs.
- **createdTime** _[date, readonly]_
	- The time that the record was created. Undefined until the record is added to a table and the table is updated.

### Functions
- **getFieldValue(field)** -> _object_
	- Takes a _string_ with the name of the field, and returns the contents of that field.
- **setFieldValue(field, object)**
	- Takes a _string_ with the name of the field, and sets the contents of the field according to the _object_ passed.
- **getLinkedRecords(field)** -> _Array of ATRecord objects_
	- For a field which links to records in another table, this returns all of the linked records. The table containing the linked records must have been added to the base.
- **linkRecord(field, ATRecord)**
	- For a field which links to records in another table, this adds a new linked record from the given field. Existing linked records are unaffected. Note that Airtable also supports linked fields which do not allow more than one linked record.
- **update()** -> _boolean_
	- Pushes changes to the base for a record that has already been added to a table. Returns `true` if successful. 

## ATTable
Represents a table within an Airtable base.

### Class Functions
- **create(name, ATBase)** -> _ATBase_
	- Create a new table object with a given name and associated with a given base. Name must coincide exactly with an existing table on the web.

### Properties
- **name** _[string, readonly]_
- **base** _[ATBase]_
- **records** _[Array of ATRecord objects]_
	- All of the records associated with the table.
- **fields** _[Array of strings]_
	- The names of the fields associated with records in the table.

### Functions
- **addRecord(ATRecord)**
	- Add a new record to the table. Will not be pushed to the web until `update()` is called.
- **update()** -> _boolean_
	- Push changes to the base. Returns `true` if successful. 

## ATBase
Represents an individual Airtable base.

### Class Functions
- **create(name)** -> _ATBase_
	- Create new base object with given name.

### Properties
- **name** _[string]_
- **tables** _[Array of ATTable objects]_
	- All of the tables associated with the base. 

### Functions
- **getRecordWithID(id)** -> _ATRecord_
	- Takes the unique id of a record within an associated table and returns the record object.