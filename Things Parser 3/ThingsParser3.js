let text = draft.content

if (text.includes("{{")) {
  let mustache = mustachePrompt(text)
  if (mustache) {
    text = mustache
  }
}


var taskPaperOutline = new birchoutline.Outline.createTaskPaperOutline(draft.processTemplate(text))
var rootChildren = taskPaperOutline.root.children

var tjsArray = []

for (child of rootChildren) {
  if (child.getAttribute("data-type") == "project") {
    tjsArray.push(processProject(child))
  } else if (child.getAttribute("data-type") == "task") {
    tjsArray.push(processTask(child))
  }
}

var container = TJSContainer.create(tjsArray)

var cb = CallbackURL.create()
cb.baseURL = container.url
cb.addParameter("reveal", true)
if (text && tjsArray.length != 0) {
  app.openURL(cb.url)
} else {
  context.cancel()
}

function processSubTask(item) {
  var subtask = TJSChecklistItem.create()
  subtask.title = item.bodyContentString.trim()
  subtask.canceled = item.hasAttribute("data-canceled") || item.hasAttribute("data-cancelled")
  subtask.completed = item.hasAttribute("data-completed") || item.hasAttribute("data-done")
  return subtask
}

function processTask(item) {
  var task = TJSTodo.create()
  task.title = item.bodyContentString.trim()
  
  if (item.hasAttribute("data-when")) {
    task.when = item.getAttribute("data-when")  
  } else if (item.hasAttribute("data-defer")) {
    task.when = item.getAttribute("data-defer")  
  }
  
  if (item.hasAttribute("data-due")) {
    task.deadline = item.getAttribute("data-due")  
  } else if (item.hasAttribute("data-deadline")) {
    task.deadline = item.getAttribute("data-deadline")  
  }
  
  task.canceled = item.hasAttribute("data-canceled") || item.hasAttribute("data-cancelled")
  task.completed = item.hasAttribute("data-completed") || item.hasAttribute("data-done")
  
  if (item.hasAttribute("data-heading")) {
    task.heading = item.getAttribute("data-heading")
  }
  
  if (item.hasAttribute("data-list")) {
    task.list = item.getAttribute("data-list")
  } else if (item.hasAttribute("data-project")) {
    task.list = item.getAttribute("data-project")
  }
  
  if (item.hasAttribute("data-listID")) {
    task.listID = item.getAttribute("data-listID")
  } else if (item.hasAttribute("data-listid")) {
    task.listID = item.getAttribute("data-listid")
  }
  
  if (item.hasAttribute("data-tag")) {
    task.tags = [item.getAttribute("data-tag")]
  } else if (item.hasAttribute("data-tags")) {
    task.tags = item.getAttribute("data-tags").split(",").map(t => t.trim())
  }
  
  if (item.hasChildren) {
    for (child of item.children) {
      if (child.getAttribute("data-type") == "task") {
       task.addChecklistItem(processSubTask(child)) 
      } else if (child.getAttribute("data-type") == "note") {
        if (task.notes) {
          task.notes += "\n" + child.bodyContentString
        } else {
          task.notes = child.bodyContentString
        }
      }
    }
  }
  return task
}

function processHeading(item) {
  var heading = TJSHeading.create()
  heading.title = item.bodyContentString.trim()
  heading.archived = item.hasAttribute("data-archived") || item.hasAttribute("data-done")
  
  return heading
}

function processProject(item) {
  var project = TJSProject.create()
  project.title = item.bodyContentString.trim()
  
  if (item.hasAttribute("data-when")) {
    project.when = item.getAttribute("data-when")  
  } else if (item.hasAttribute("data-defer")) {
    project.when = item.getAttribute("data-defer")  
  }
  
  if (item.hasAttribute("data-due")) {
    project.deadline = item.getAttribute("data-due")  
  } else if (item.hasAttribute("data-deadline")) {
    project.deadline = item.getAttribute("data-deadline")  
  }
  
  project.canceled = item.hasAttribute("data-canceled") || item.hasAttribute("data-cancelled")
  project.completed = item.hasAttribute("data-completed") || item.hasAttribute("data-done")
  
  if (item.hasAttribute("data-area")) {
    project.area = item.getAttribute("data-area")
  }
  
  if (item.hasAttribute("data-areaID")) {
    project.areaID = item.getAttribute("data-areaID")
  } else if (item.hasAttribute("data-areaid")) {
    project.areaID = item.getAttribute("data-areaid")
  }
  
  if (item.hasAttribute("data-tag")) {
    project.tags = [item.getAttribute("data-tag")]
  } else if (item.hasAttribute("data-tags")) {
    project.tags = item.getAttribute("data-tags").split(",").map(t => t.trim())
  }
  
  if (item.hasChildren) { 
    
    for (child of item.children) {
      if (child.getAttribute("data-type") == "task") {
       project.addTodo(processTask(child)) 
      } else if (child.getAttribute("data-type") == "note") {
        if (project.notes) {
          project.notes += "\n" + child.bodyContentString
        } else {
          project.notes = child.bodyContentString
        }
      } else if (child.getAttribute("data-type") == "project") {
        let heading = processHeading(child)
        project.addHeading(heading)
        
        if (child.hasChildren) {
          for (grandchild of child.children) {
            if (grandchild.getAttribute("data-type") == "task") {
              let task = processTask(grandchild)
              task.heading = heading.title
              project.addTodo(task)
            }
          }
        }
      }
    }
  }
  return project
  
}
  