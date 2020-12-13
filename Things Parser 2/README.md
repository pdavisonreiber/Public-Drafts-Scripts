# Things Parser

## Intro

This script action sends each line of the draft to Things 3. Special characters can be added to each line (after the task name) to create additional metadata about the task.

The syntax is as follows:

#Project Name 
@Tag Name
==Heading
//Task note
!Natural Language Deadline String
*Checklist Item

Each of these markup characters should be immediately preceded by a space. The task name must come first in the line. The date and time of the event can be written in natural language anywhere in the line, and does not require a special character. The script also automatically detects whether or not a time has been written. If a date and time are written, it adds a task with that date and a reminder at that time. If only a date is written, it doesn’t add a reminder.

Multiple tags and checklist items can be entered.

Special characters can be used elsewhere in the line, as long as they are not immediately preceded by a space, so for example the following is fine.

//Note containing email address: me@domain.com 

is perfectly fine.

Examples:

	Task name
*Adds item to Inbox*

	Task name on Wednesday
*Adds item to Upcoming with Wednesday as date*

	Task name on Wednesday at 6pm
*Adds item to Upcoming with Wednesday as date and a reminder at 6pm*

	Task name on Wednesday at 6pm !Friday
*Same as above with a deadline of Friday*

	Task name on Wednesday at 6pm #Project Name ==Heading @Tag 1 @Tag 2 ++Additional Note !Friday *first thing *second thing *third thing

*Adds item to project called `Project Name` under `Heading` with date of Wednesday, reminder at 6pm, two tags `Tag 1` and `Tag 2`, an additional note `Additional Note`, and a checklist with the following three items:*

* `first thing`
* `second thing`
* `third thing`

## Block-Based Entry

To save time in entering metadata, if the first line of a block of text contains only metadata, this will be inherited by every other line in that block. So instead of writing:

	task 1 today
	task 2 today
	task 3 today

you can simply write:

	Today
	task 1
	task 2
	task 3

This works with all possible metadata:

	today at 5pm !Friday #Project ==Heading @Tag 1 @Tag 2 *checklist item 1 *checklist item 2 //note
	task 1
	task 2
	task 3

If a task has metadata that conflicts with the block heading, the task’s metadata wins, but it will still inherit anything that doesn’t conflict. So things like this are fine:

	#Project !Friday
	Task 1
	Task 2 !Monday
	Task 3

Task 2 will be added to `Project` but will have a different deadline to the other tasks. 

Multiple blocks can be entered within a single draft and should be separated by a blank line.

## New Project Creation

Using the syntax `+Project` you can create a new project and add tasks to it. It works in two different modes: in-line and block-based. 

### In-Line

With the in-line mode you can just add `+Project` to the end of any line and it will create a new project with that task as the only entry. Headings can also be created, and an area can be specified. Any other metadata is assigned to the task:

	task +Project ==Heading #Area today at 5pm !Friday

This creates a project called `Project` in `Area` with a heading and a single task under that heading. The task is assigned to today, has a reminder for 5pm, and has a deadline of Friday.

### Block-Based

Block-based mode works in similar way with a couple of small changes: all metadata on the block heading is inherited by the new project, not the tasks, and multiple headings can be specified. Metadata must be specified for each task individually. If a task is given one of the headings specified in the block heading, it will be put under that heading, otherwise it will be assigned to the project with no heading.

	+Project today at 5pm ==Heading 1 ==Heading 2 #Area @tag
	Task with no heading
	Task under heading 1 ==Heading 1
	Task under heading 2 ==Heading 2

In this case, the date and tag will be added to the project, *not* the tasks.

It is possible to combine the project creation feature with the block-based task metadata inheritance using two blocks, one which creates the new project, and then another which adds tasks under it. So for example, if I wanted to create an important work project due on Friday with three tasks I wanted to work on today, I could do the following:

	+Project #Work !Friday @Important
	
	today #Project
	task 1
	task 2
	task 3


