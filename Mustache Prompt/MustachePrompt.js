function mustachePrompt(text, dateFormat) {
  dateFormat = (dateFormat === undefined) ? "%Y-%m-%d" : dateFormat
  
  const variableRegex = /{{(?:(date|bool):)?(#|^)?(\w+)\??([+|-]\d+[d|w|m])?}}/g
  const variableMatches = text.matchAll(variableRegex)
  
  variables = {}
  
  for (match of variableMatches) {
    let instance = new Object()
    instance.string = match[0]
    instance.type = match[1]
    instance.modifier = match[2]
    instance.name = match[3]
    instance.offset = match[4]
    
    if (!variables.hasOwnProperty(instance.name)) {
      let variable = new Object()
      variable.type = instance.type
      variable.modifier = instance.modifier
      variable.instances = [instance]
      variables[instance.name] = variable
    } else {
      variables[instance.name].instances.push(instance)
      if (!variables[instance.name].type) {
        variables[instance.name].type = instance.type
      }
      if (!variables[instance.name].modifier) {
        variables[instance.name].modifier = instance.modifier
      }
    }
  }
  
  //alert(JSON.stringify(variables))
  
  let p = Prompt.create()
  
  for (name in variables) {
    let variable = variables[name]
    
    if (!variable.type) {
      p.addTextField(name, name, "")
    } else if (variable.type == "date") {
      p.addDatePicker(name, name, new Date(), {mode: "date"})
    } else if (variable.type == "bool") {
      p.addSwitch(name, name, false)
    }
  }
  
  p.addButton("OK")
  data = {}
  
  let cancel = true
  if (Object.keys(variables).length !== 0) {
    cancel = !p.show()
  }
  
  if (!cancel) {
    for (key in p.fieldValues) {
      let fieldValue = p.fieldValues[key]
      if (fieldValue instanceof Date) {
        data[key] = strftime(fieldValue, dateFormat)
      } else if (typeof fieldValue == "string") {
        if (fieldValue.includes(",") && variables[key].modifier == "#") {
          data[key] = fieldValue.split(",").map(s => s.trim())
        } else {
          data[key] = fieldValue
        }
      } else {
        data[key] = fieldValue
      }
      
      for (instance of variables[key].instances) {
        if (!instance.type && !instance.offset) {
          continue
        }
        
        if (instance.offset) {
          text = text.replace(instance.string, instance.string.replace(instance.type + ":", "").replace(instance.offset, snakify(instance.offset)))
          data[key + snakify(instance.offset)] = offsetDate(fieldValue, instance.offset, dateFormat)
        } else {
          text = text.replace(instance.string, instance.string.replace(instance.type + ":", ""))
        }
      }
    }
    //alert(JSON.stringify(data, 2))
    
    let template = MustacheTemplate.createWithTemplate(text)
    let result = template.render(data).replace(/\n{2,}/g, "\n\n")
    return result
    
  } else {
    context.cancel()
  }  
}

function offsetDate(date, string, dateFormat) {
  let d = new Date(date)
  let offsetRegex = /(\+|-)(\d+)(d|w|m)/
  let match = string.match(offsetRegex)
  let multiplier = (match[1] == "+" ? 1 : -1)
  
  if (match[3] == "d") {
    d.setDate(d.getDate() + multiplier * parseInt(match[2]))
  } else if (match[3] == "w") {
    d.setDate(d.getDate() + multiplier * 7 * parseInt(match[2]))
  } else if (match[3] == "m") {
    d = addMonths(d, multiplier * parseInt(match[2]))
  }
  
  return strftime(d, dateFormat)
}

function addMonths(date, months) {
  var d = date.getDate();
  date.setMonth(date.getMonth() + +months);
  if (date.getDate() != d) {
    date.setDate(0);
  }
  return date;
}

function snakify(offset) {
  return offset.replace("+", "_offset_forward_").replace("-", "_offset_backwards_")
}
