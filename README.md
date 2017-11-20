# stata-exec

Send code to Stata from the [Atom](https://atom.io). _Note: This is for Mac only. Windows support is planned; Linux users can use [stata-autokey](https://github.com/kylebarron/stata-autokey)._ This was originally ported from the very good [r-exec](https://atom.io/packages/r-exec) package.

![run-command](./img/run_command.gif)

## News
Version 1.1.0 includes the ability to run code in a session of Stata running on a remote server. See the configuration settings below for details.

## Installation

In the terminal run `apm install stata-exec` or go to Settings > Install and search for `stata-exec`. This package depends on [`language-stata`](https://atom.io/packages/language-stata), which you will be prompted to install if needed.

## Usage

Code can be run using either the Command Palette or with keyboard shortcuts. _Important: You must first select the flavor of Stata you own. See configuration settings [below](#configuration)._

To open the Command Palette, press `cmd-shift-P`, and then start typing `Stata Exec`. The available commands will be shown in the drop-down menu.

The following are the default keyboard shortcuts. These can be personalized in your [`keymap.cson`](http://flight-manual.atom.io/behind-atom/sections/keymaps-in-depth/).
- `cmd-enter`: send selection or current line to Stata.
- `shift-cmd-d`: send entire file to Stata. (File must be saved first. This runs `do "/path/to/current/file"`)
- `shift-alt-p`: send the previous command.
- `shift-cmd-c`: change Stata's working directory to that of current file.
- `shift-cmd-g`: send paragraph under current cursor. A paragraph is a region enclosed by whitespace.
- `shift-cmd-r`: send program definition under current cursor. For example, all the lines in the below snippet would be sent to Stata:

    ```stata
    program define myProgram
        // program contents
    end
    ```

## Configuration

All configuration can be done in the settings panel (Settings > Packages > stata-exec). The available options are listed below:

- Which App
  - Select **StataIC**, **StataSE**, or **StataMP** depending on which version of Stata you have.
  - Select **XQuartz** if you want to run selections in session of Stata on a remote Unix server. To set this up, you need to have Stata already open in XQuartz; Atom will not open it for you. In your terminal, you'll need to do something like `ssh username@host -Y`, likely followed by `xstata`. This package's commands to run the entire do file and set the working directory are not supported on XQuartz.
- Advance Position
  - If checked, move cursor to the next line/paragraph after running the current line/paragraph.
- Focus Window
  - If checked, bring the Stata window to focus when sending code.
  - Otherwise, code runs in the background and the screen remains focused on Atom.
- Notifications
  - If checked, a pop-up notification will appear when a paragraph or function is not identified.
- Skip Comments
  - If this and Advance Position are checked, the after running a line, the cursor will move to the next uncommented line.
- Paste Speed
  - This is only applicable for XQuartz. This value changes the amount of time the program waits between switching to the XQuartz window, pasting code, and sending "enter". The only way to send code to XQuartz is to use the clipboard, and the responsiveness of this process will depend on the speed of your internet connection. If the copy-pasting isn't working, try increasing the value. Decreasing the value will run your code faster. Value must be between 0.1 and 10.

## Notes

This package is currently Mac-only. I hope to add Windows support, but need to figure out some Visual Basic or VBScript first. Linux users can use [stata-autokey](https://github.com/kylebarron/stata-autokey) to run selections in a GUI session of Stata.

### Troubleshooting and Known Issues
- _Do entire file_ doesn't run the last line of the do file.
  - Stata needs there to be a _newline_ character following the last line of text. Add an empty line to the end of the file and it'll work.
- Stata's console doesn't accept comment characters like `//`, `///`, and `/* */`. This package thus must remove comments before running the code, but currently also removes those characters from strings. Hence you might find weird behavior if you have such characters in a string.


