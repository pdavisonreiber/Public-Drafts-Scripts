class ATURL {
	constructor(baseURL) {
		this.baseURL = baseURL;
		this.parameters = {};
	}
	
	addParameter(key, value) {
		this.parameters[key] = value;
	}
	
	constructURL() {
		let parametersArray = new Array();
		
		for (let parameterName in this.parameters) {
			let encodedParameter = encodeURIComponent(this.parameters[parameterName]);
			parametersArray.push(parameterName + "=" + encodedParameter);
		}
		
		if (parametersArray.length == 0) {
			return this.baseURL;
		} else {
			return this.baseURL + "?" + parametersArray.join("&");
		}
	}
	
}

class ATHTTPRequest {
	constructor(table) {
		this.table = table;
		this.responseData = undefined;
		this.error = undefined;
		this.success = undefined;
	}
	
	static _createPostData(record) {
		let data = new Object();
		data.id = record.id;
		data.fields = record._fields;
		return data;
	}
	
	static _createPatchData(record) {
		let data = new Object();
		data.fields = record._changedFields;
		return data;
	}
	
	static _errorMessage(response) {
		if (response.error) {
			return response.error
		} else {
			switch(response.statusCode) {
				case 400:
					return "400: Bad Request";
					break;
				case 401:
					return "401: Unauthorized";
					break;
				case 402:
					return "402: Payment Required";
					break;
				case 403:
					return "403: Forbidden";
					break;
				case 404:
					return "404: Not Found";
					break;
				case 413:
					return "413: Request Entity Too Large";
					break;
				case 422:
					return "422: Invalid Request";
					break;
				case 500:
					return "500: Internal Server Error";
					break;
				case 502:
					return "502: Bad Gateway";
					break;
				case 503:
					return "503: Service Unavailable";
					break;
			}
		}
	}
	
	get(options = {}) {
		let http = HTTP.create();
		let url = new ATURL("https://api.airtable.com/v0/" + this.table.base._endpoint + "/" + encodeURIComponent(this.table.name));
		url.parameters = options;
		let response = http.request({
			"url": url.constructURL(),
			"method": "GET",
			"headers": {"Authorization": "Bearer " + this.table.base._apiKey}
		});
		
		if (response.success) {
			this.responseData = JSON.parse(response.responseText);
		} else {
			this.error = ATHTTPRequest._errorMessage(response);
			this.table.lastError = this.error;
			app.displayErrorMessage(this.error);
		}
		
		return response.success;
	}
	
	post(record) {
		let http = HTTP.create();
		let url = new ATURL("https://api.airtable.com/v0/" + this.table.base._endpoint + "/" + encodeURIComponent(this.table.name));
		let response = http.request({
			"url": url.constructURL(),
			"method": "POST",
			"data": ATHTTPRequest._createPostData(record),
			"headers": {"Authorization": "Bearer " + this.table.base._apiKey, "Content-type": "application/json"}
		});
		
		if (response.success) {
			this.responseData = JSON.parse(response.responseText);
		} else {
			this.error = ATHTTPRequest._errorMessage(response);
			this.table.lastError = this.error;
			app.displayErrorMessage(this.error);
		}
		
		return response.success;
	}
	
	patch(record) {
		let http = HTTP.create();
		let url = new ATURL("https://api.airtable.com/v0/" + this.table.base._endpoint + "/" + encodeURIComponent(this.table.name) + "/" + record.id);
		let response = http.request({
			"url": url.constructURL(),
			"method": "PATCH",
			"data": ATHTTPRequest._createPatchData(record),
			"headers": {"Authorization": "Bearer " + this.table.base._apiKey, "Content-type": "application/json"}
		});
		
		if (response.success) {
			this.responseData = JSON.parse(response.responseText);
		} else {
			this.error = ATHTTPRequest._errorMessage(response);
			this.table.lastError = this.error;
			app.displayErrorMessage(this.error);
		}
		
		return response.success;
	}
}

class ATRecord {
	
	constructor() {
		this._id = undefined;
		this._table = undefined;
		this._createdTimed = undefined;
		this._fields = new Object();
		this._changedFields = new Object();
	}
	
	get id() {
		return this._id;
	}
	
	set id(value) {
		app.displayErrorMessage("The id property of ATRecord is read only");
		contex.cancel();
	}
	
	get table() {
		return this._table;
	}
	
	set table(value) {
		app.displayErrorMessage("The id property of ATRecord is read only");
		contex.cancel();
	}
	
	get createdTime() {
		return this._createdTime;
	}
	
	set createdTime(value) {
		app.displayErrorMessage("The id property of ATRecord is read only");
		contex.cancel();
	}
	
	static create() {
		return new ATRecord();
	}
	
	static _createFromData(data, table) {
		let record = new ATRecord();
		record._id = data.id;
		record._createdTimed = new Date(data._createdTimed);
		record._fields = data.fields;
		record.table = table;
		return record;
	}
	
	getFieldValue(field) {
		return this._fields[field];
	}
	
	setFieldValue(field, value) {
		this._fields[field] = value;
		this._changedFields[field] = value;
	}
	
	getLinkedRecords(field) {
		return this._fields[field].map(id => this._table.base.getRecordWithID(id));
	}
	
	linkRecord(field, record) {
		this._fields[field].push(record.id);
		this._changedFields[field] = this._fields[field];
	}
	
	_pushToTable() {
		let httpRequest = new ATHTTPRequest(this._table);
		let success = httpRequest.post(this);
		this._changedFields = {};
		this._id = httpRequest.responseData.id;
		this._fields = httpRequest.responseData.fields;
		this._createdTimed = new Date(httpRequest.responseData.createdTime);
		return httpRequest;
	}
	
	update() {
		if (this._table && this._id) {
			let httpRequest = new ATHTTPRequest(this._table);
			let success = httpRequest.patch(this);
			
			if (success) {
				this._changedFields = {};
				this._fields = httpRequest.responseData.fields;
				return true;
			} else {
				return false;
			}
			
		} else if (this._table) {
			alert("ERROR: table must be updated before record can be updated");
		} else {
			alert("ERROR: record not yet added to table");
			return false;
		}
	}
	
	static selectRecords(records, field, options = {}) {
		let title = options.title || "Select Records";
		let message = options.message || "";
		let type = options.type || "selectMultiple";
		let filter = options.filter || function () { return true };
		
		let prompt = Prompt.create();
		prompt.title = title;
		prompt.message = message;
		switch (type) {
			case "selectMultiple":
			case "selectOne":
				let fieldToRecordMap = {};
				records.forEach(record => { fieldToRecordMap[record._fields[field]] = record });
				let recordFields = records.filter(filter).map(record => record._fields[field]).sort((a, b) => a.localeCompare(b));
				prompt.addSelect("selectedRecords", "", recordFields, [], type == "selectMultiple");
				prompt.addButton("OK");
				let selected = prompt.show();
				if (selected) {
					return prompt.fieldValues["selectedRecords"].map(field => fieldToRecordMap[field]);
				} else {
					context.cancel();
				}
				break;
			case "selectButtons":
				let idToRecordMap = {};
				records.forEach(record => { idToRecordMap[record._id] = record });
				records.filter(filter).sort((a, b) => a._fields[field].localeCompare(b._fields[field])).forEach(record => { prompt.addButton(record._fields[field], record._id) });
				let selected2 = prompt.show();
				if (selected2) {
					return [idToRecordMap[prompt.buttonPressed]];
				} else {
					context.cancel();
				}
				break;
		}
	}
}
	
class ATTable {
	constructor(name, base) {
		this._name = name;
		this._base = base;
		this._pulledRecords = new Array();
		this._unPushedRecords = new Array();
		this.lastError = undefined;
		this._idToRecordMap = new Object();
		base._tables.push(this);
		this._pullData();
		this._mapIDsToRecords()
	}
	
	get name() {
		return this._name;
	}
	
	set name(value) {
		app.displayErrorMessage("The name property of ATTable is read only");
		contex.cancel();
	}
	
	get base() {
		return this._base;
	}
	
	set base(value) {
		app.displayErrorMessage("The base property of ATTable is read only");
		contex.cancel();
	}
	
	static create(name, base){
		return new ATTable(name, base);
	}
	
	get records() {
		return this._pulledRecords.concat(this._unPushedRecords);
	}
	
	set records(value) {
		app.displayErrorMessage("The records property of ATTable is read only");
		contex.cancel();
	}
	
	get fields() {
		if (this._pulledRecords.length > 0) {
			return Object.keys(this._pulledRecords[0]._fields);
		} else {
			return undefined;
		}
	}
	
	set fields(value) {
		app.displayErrorMessage("The fields property of ATTable is read only");
		contex.cancel();
	}
	
	_pullData() {
		let httpRequest = new ATHTTPRequest(this);
		let success = httpRequest.get();
		
		if (success) {
			let rawData = httpRequest.responseData.records;
			this._pulledRecords = rawData.map(rec => ATRecord._createFromData(rec, this));
			
			while (httpRequest.responseData.hasOwnProperty("offset")) {
				let offset = httpRequest.responseData.offset;
				let success = httpRequest.get({"offset": offset});
				
				if (success) {
					this._pulledRecords = this._pulledRecords.concat(httpRequest.responseData.records);
				} else {
					this.lastError = httpRequest.error;
					this.lastStatusCode = httpRequest.statusCode;
					break;
				}
			}
		} else {
			return false;
		}
	}
	
	_mapIDsToRecords() {
		for (let record of this._pulledRecords) {
			this._idToRecordMap[record.id] = record;
		}
	}
	
	addRecord(record) {
		this._unPushedRecords.push(record);
		record.table = this;
	}
	
	update() {
		
		for (let record of this._unPushedRecords) {
			let response = record._pushToTable(this);
			if (!response.success) {
				return false;
			}
		}
		
		let success = this._pullData();
		this._unPushedRecords = [];
		this._mapIDsToRecords();
		
		return success;
	}
}

class ATBase {
	constructor(name) {
		this._name = name;
		this._tables = new Array();
		this._authorize();
	}
	
	get tables() {
		return this._tables;
	}
	
	set tables(value) {
		app.displayErrorMessage("The tables property of ATBase is read only");
		contex.cancel();
	}
	
	static create(name) {
		return new ATBase(name);
	}
	
	_authorize() {
		let credential = Credential.create("Airtable (" + this._name + ")", "Enter base info");
		credential.addTextField("endpoint", "Endpoint");
		credential.addPasswordField("apiKey", "API key");
		credential.authorize();
		this._endpoint = credential.getValue("endpoint");
		this._apiKey = credential.getValue("apiKey");
	}
	
	getRecordWithID(id) {
		let _idToRecordMap = Object.assign({}, ...this._tables.map(table => table._idToRecordMap));
		return _idToRecordMap[id];
	} 
	
}
