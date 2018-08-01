class URL {
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

class HTTPRequest {
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
		let url = new URL("https://api.airtable.com/v0/" + this.table.base._endpoint + "/" + encodeURIComponent(this.table.name));
		url.parameters = options;
		let response = http.request({
			"url": url.constructURL(),
			"method": "GET",
			"headers": {"Authorization": "Bearer " + this.table.base._apiKey}
		});
		
		if (response.success) {
			this.responseData = JSON.parse(response.responseText);
		} else {
			this.error = HTTPRequest._errorMessage(response);
			this.table.lastError = this.error;
			app.displayErrorMessage(this.error);
		}
		
		return response.success;
	}
	
	post(record) {
		let http = HTTP.create();
		let url = new URL("https://api.airtable.com/v0/" + this.table.base._endpoint + "/" + encodeURIComponent(this.table.name));
		let response = http.request({
			"url": url.constructURL(),
			"method": "POST",
			"data": HTTPRequest._createPostData(record),
			"headers": {"Authorization": "Bearer " + this.table.base._apiKey, "Content-type": "application/json"}
		});
		
		if (response.success) {
			this.responseData = JSON.parse(response.responseText);
		} else {
			this.error = HTTPRequest._errorMessage(response);
			this.table.lastError = this.error;
			app.displayErrorMessage(this.error);
		}
		
		return response.success;
	}
	
	patch(record) {
		let http = HTTP.create();
		let url = new URL("https://api.airtable.com/v0/" + this.table.base._endpoint + "/" + encodeURIComponent(this.table.name) + "/" + record.id);
		let response = http.request({
			"url": url.constructURL(),
			"method": "PATCH",
			"data": HTTPRequest._createPatchData(record),
			"headers": {"Authorization": "Bearer " + this.table.base._apiKey, "Content-type": "application/json"}
		});
		
		if (response.success) {
			this.responseData = JSON.parse(response.responseText);
		} else {
			this.error = HTTPRequest._errorMessage(response);
			this.table.lastError = this.error;
			app.displayErrorMessage(this.error);
		}
		
		return response.success;
	}
}

class Record {
	
	constructor() {
		this.id = undefined;
		this.table = undefined;
		this._fields = new Object();
		this._changedFields = new Object();
	}
	
	static create() {
		return new Record();
	}
	
	static _createFromData(data, table) {
		let record = new Record();
		record.id = data.id;
		record.createdTime = new Date(data.createdTime);
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
		this._fields[field].map(this.table.base.getRecordWithID);
	}
	
	_pushToTable() {
		let httpRequest = new HTTPRequest(this.table);
		let success = httpRequest.post(this);
		this._changedFields = {};
		return httpRequest;
	}
	
	update() {
		if (this.table && this.id) {
			let httpRequest = new HTTPRequest(this.table);
			let success = httpRequest.patch(this);
			
			if (success) {
				this._changedFields = {};
				let tableSuccess = this.table.update();
			}
			
			return success && tableSuccess;
			
		} else if (this.table) {
			alert("ERROR: table must be updated before record can be updated");
		} else {
			alert("ERROR: record not yet added to table");
			return false;
		}
	}
}

class Table {
	constructor(name, base) {
		this.name = name;
		this.base = base;
		this._pulledRecords = new Array();
		this._unPushedRecords = new Array();
		this.fieldLinks = new Object();
		this.lastError = undefined;
		this._idToRecordMap = new Object();
		base.tables.push(this);
		this._pullData();
		this._mapIDsToRecords()
	}
	
	static create(name, base){
		return new Table(name, base);
	}
	
	get records() {
		return this._pulledRecords.concat(this._unPushedRecords);
	}
	
	_pullData() {
		let httpRequest = new HTTPRequest(this);
		let success = httpRequest.get();
		
		if (success) {
			let rawData = httpRequest.responseData.records;
			this._pulledRecords = rawData.map(rec => Record._createFromData(rec, this));
			
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

class Base {
	constructor(name) {
		this.name = name;
		this.tables = new Array();
		this._authorize();
	}
	
	static create(name) {
		return new Base(name);
	}
	
	_authorize() {
		let credential = Credential.create("Airtable (" + this.name + ")", "Enter base info");
		credential.addTextField("endpoint", "Endpoint");
		credential.addPasswordField("apiKey", "API key");
		credential.authorize();
		this._endpoint = credential.getValue("endpoint");
		this._apiKey = credential.getValue("apiKey");
	}
	
	getRecordWithID(id) {
		let _idToRecordMap = Object.assign({}, ...this.tables.map(table => table._idToRecordMap));
		return _idToRecordMap[id];
	} 
	
}
