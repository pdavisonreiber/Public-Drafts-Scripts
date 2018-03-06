# Things Parser

## Intro

This script is designed to be used with [Drafts 5][1]. It takes each line of the current draft and turns it into a task in [Things 3][2]. It uses the [add-json command][3] to add all of the tasks in a single URL scheme call. It uses the [Chrono JS parser][7] for natural language date and time processing, rather than just relying on the more basic date and time recognition built into Things.

It was inspired by [Federico Viticci’s][4] [article in MacStories][5] about the [workflow he built][6] to do the same thing.

My script is fully compatible with his syntax:

- # Project Name 
- @Tag Name
- ==Heading
- ++Task note

It is also compatible with his syntax for date and time strings:

- \\\\natural date and time string

However, the double backslash is no longer required since Chrono can detect the date-time string wherever it is written in the line. The script also automatically detects whether or not a time has been written. If a date and time are written, it adds a task with that date and a reminder at that time. If only a date is written, it doesn’t add a reminder.

In addition, my script adds the following syntax:

- !natural language deadline string
- *checklist item

As with tag names in Federico’s workflow, multiple checklist items can also be entered.

The automatic escaping of special characters is handled by Drafts, so there shouldn’t be any JSON errors. Syntax characters as detailed above can be used in other fields, as long as they are not immediately preceded by a space. So for example, 

++Note containing email address: me@domain.com 

is perfectly fine.

## Examples

Task name
*Adds item to Inbox*

Task name on Wednesday
*Adds item to Upcoming with Wednesday as date*

Task name on Wednesday at 6pm
*Adds item to Upcoming with Wednesday as date and a reminder at 6pm*

Task name on Wednesday at 6pm !Friday
*Same as above with a deadline of Friday*

Task name on Wednesday at 6pm #Project Name ==Heading @Tag 1 @Tag 2 ++Additional Note !Friday *first thing *second thing *third thing

*Adds item to project called “Project Name” under heading “Heading” with date of Wednesday, reminder at 6pm, two tags “Tag 1” and “Tag 2”, an additional note “Additional Note”, and a checklist with the following three items:*

* first thing
* second thing
* third thing

[1]: https://agiletortoise.github.io/drafts-documentation/
[2]: https://itunes.apple.com/gb/app/things-3-for-ipad/id904244226?mt=8&uo=4&at=1001lsF2
[3]: https://support.culturedcode.com/customer/en/portal/articles/2803573#add-json
[4]: https://www.twitter.com/viticci
[5]: https://www.macstories.net/ios/things-automation-building-a-natural-language-parser-in-workflow/
[6]: https://workflow.is/workflows/b852622a129a45ab81322b0003a7314a
[7]: https://github.com/wanasit/chrono