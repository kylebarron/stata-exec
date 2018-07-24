# Changelog

## [1.6.0] - 2018-07-24

- Use xdotool instead of autokey on Linux
    - Improves paste speed, reliability; allows for pasting unicode characters
    - Allows you to type while the code is pasting
    - In future could create functionality to support two Stata windows at once
- Important bugfixes for using xdotool
    - Search only for the first Stata window
    - Force <kbd>ctrl</kbd> to be not pressed when the program sends <kbd>ctrl</kbd>+<kbd>v</kbd>. Since the user usually is pressing <kbd>ctrl</kbd> to run the command, this is important. Otherwise all that is entered into Stata is <kbd>v</kbd>.


## [1.5.2] - 2018-06-01

- Update keymaps so the package works within Dynamic Documents

## [1.5.1] - 2018-05-17
- Require that `end` be on a line by itself to indicate the end of a program.
    This is to prevent false positives where the word "end" appears elsewhere.

## [1.5.0] - 2018-05-17
- Update API to resemble Hydrogen's API (keeping current keyboard shortcuts)
- Add `Run and Move Down` command, bound to <kbd>shift</kbd>-<kbd>enter</kbd>
- Fix bug in Linux where sending a large selection pasted some text in Atom instead of Stata.

## [1.4.6] - 2018-03-23
- Fix bug that prevented graph windows from opening

## [1.4.5] - 2018-03-22
- Add final `\r` to code on Windows

## [1.4.4] - 2018-03-22
- Remove `\r\n` when removing comments, not just `\n`, to support windows line endings

## [1.4.3] - 2018-03-09
- On Windows, when opening a new Stata session, set Stata's working directory to current file's working directory

## [1.4.2] - 2018-03-09
- Small additions to README

## [1.4.1] - 2018-03-09
- Try loading winax in a try/catch clause

## [1.4.0] - 2018-03-09
- Add Windows support!

## [1.3.2] - 2018-02-23
- Add try-except clause in `linux/stata-exec.py` to hopefully work correctly on Arch Linux.

## [1.3.1] - 2018-01-31
- Same as 1.3.0 but didn't publish correctly the first time

## [1.3.0] - 2018-01-31
- Fix running of multiple lines with ///

## [1.2.1] - 2017-11-20
- Fix bug that couldn't find removeComments

## [1.2.0] - 2017-11-20
- Add linux support.
- Remove comments for all methods of sending code, not just 'send-command'
- Change warnings from "can't find function" to "can't find program"

## [1.1.2] - 2017-11-19
- Fix comment removal to not touch comments in strings. Fixes https://github.com/kylebarron/stata-exec/issues/2
    - Thanks to https://stackoverflow.com/questions/24518020/comprehensive-regexp-to-remove-javascript-comments

## [1.1.1] - 2017-11-19
- Add restriction that code sent through Applescript can be max 8192 characters. https://www.stata.com/automation/#list
- Include a line with `program drop myProgram` if it comes before `program define myProgram` when sending a program to Stata.

## [1.1.0] - 2017-11-19
- Add XQuartz support. This allows code to be run on macOS in a session of Stata running on a remote server.

## [1.0.3] - 2017-11-15
- Fix the "Set Working Directory" command to use compound double quotes.
- Refactor "Do Entire File" to use `addSlashes()`
- Fix links in README.md; some other updates.

## [1.0.1] and [1.0.2] - 2017-11-13
- No updates; issues getting atom.io to publish the package.

## [1.0.0] - 2017-11-13
- Atom [stata-exec](https://atom.io/packages/stata-exec) package transferred to [@kylebarron](https://github.com/kylebarron) and hosted at https://github.com/kylebarron/stata-exec.
- Ported from version 0.5.0 of [atom-r-exec](https://github.com/pimentel/atom-r-exec). All functionality ported:
    - cmd-enter: send selection or current line to Stata.
    - shift-cmd-d: send entire file to Stata. (File must be saved first. This runs do "/path/to/current/file")
    - shift-alt-p: send the previous command.
    - shift-cmd-c: change Stata's working directory to that of current file.
    - shift-cmd-g: send paragraph under current cursor. A paragraph is a region enclosed by whitespace.
    - shift-cmd-r: send program definition under current cursor. For example, all the lines in the below snippet would be sent to Stata:

## [0.2.0] - 2017-06-27
- Original code created by [@nickeubank](https://github.com/nickeubank). Still in repository located at https://github.com/nickeubank/atom-stata-exec.