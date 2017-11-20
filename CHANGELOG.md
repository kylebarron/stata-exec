# Changelog

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