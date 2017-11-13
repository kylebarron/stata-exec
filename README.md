# stata-exec

Send Stata code to the Stata window from the Atom text editor. _Note: This is for Mac only. Windows support is planned; Linux users can use ![stata-autokey](https://github.com/kylebarron/stata-autokey)._

## Installation

In the terminal run `apm install stata-exec` or search for `stata-exec` in Settings > Install. This package depends on ![`language-stata`](https://atom.io/packages/language-stata), and you will be prompted to install that package if you have not yet installed it.

## Usage

Code can be run using either the Command Palette or with keyboard shortcuts. To open the Command Palette, press `cmd-shift-P`, and then start typing `Stata Exec`. The available commands will be shown in the drop-down menu.

The following are the default keyboard shortcuts. These can be personalized in your ![`config.cson`](http://flight-manual.atom.io/behind-atom/sections/keymaps-in-depth/).
- `cmd-enter`: send selection or current line to Stata.
- `shift-cmd-d`: send entire file to Stata. (File must be saved first. This runs `do "/path/to/current/file"`)
- `shift-alt-p`: send the previous command.
- `shift-cmd-c`: change Stata's working directory to that of current file.
- `shift-cmd-p`: send paragraph under current cursor. A paragraph is a region enclosed by whitespace.
- `shift-cmd-r`: send program definition under current cursor. For example, all the lines in the below snippet would be sent to Stata:
```stata
program define myProgram
    // program contents
end
```

## Configuration

All configuration can be done in the settings panel (Settings > Packages > stata-exec). The available options are listed below:

- Which App
  - Select StataIC, StataSE, or StataMP, depending on which version of Stata you have.
- Advance Position
  - If checked, move cursor to the next line/paragraph after running the current line/paragraph.
- Focus Window
  - If checked, bring the Stata window to focus when sending code.
  - Otherwise, code runs in the background and the screen remains focused on Atom.
- Notifications
  - If checked, a pop-up notification will appear when a paragraph or function is not identified.
- Skip Comments
  - If this and Advance Position are checked, the after running a line, the cursor will move to the next uncommented line.

## Notes

This package is currently Mac-only. I hope to add Windows support, but need to figure out some Visual Basic or VBScript first. Linux users can use ![stata-autokey](https://github.com/kylebarron/stata-autokey) to run selections in a GUI session of Stata.

## Troubleshooting

#### `stata-exec:do-entire-file` doesn't run the last line of the do file.
    - Stata needs there to be a _newline_ character following the last line of text. Add an empty line to the end of the file and it'll work.

### Known bugs

