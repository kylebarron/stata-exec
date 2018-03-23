# stata-exec

Send code to Stata from [Atom](https://atom.io). This package supports Windows, MacOS, and Linux.

![run-command](./img/run_command.gif)

## News
- Version 1.4.0 includes Windows support!

## Installation

In the terminal run `apm install stata-exec` or go to Settings > Install and search for `stata-exec`.
This package depends on [`language-stata`](https://atom.io/packages/language-stata), which you should be prompted to install if needed.

### MacOS


MacOS has no dependencies but you must select the flavor of Stata you own in the package's configuration. Learn more in the [configuration section](#configuration) below. Then head to the [usage section](#usage) for more details on running code.

### Windows

Windows installation has a few steps, and I haven't been able to perfectly reproduce the working package on all computers. I hope to make this easier in the future, but for now this will have to do. Sadly, at this point **you need administrator privileges** to install this for Windows.

1. Make sure you've installed this package and `language-stata`. In the command prompt, run `apm install stata-exec language-stata` or go to Settings > Install and search for `stata-exec` and `language-stata`.
2. [Install this specific version of the program Node to your computer](https://nodejs.org/dist/v7.4.0/node-v7.4.0-x64.msi). Use the default installation settings.
3. Open up an administrator PowerShell (you can right click on the Windows icon at the bottom left and select "Windows PowerShell (Admin)") and type in:

    ```
    npm install --global --production windows-build-tools
    ```
    This took me 5-10 minutes to install. This is installing Python and other tools needed to install the package in the next step. When finished you should see a long list of names in a tree, like this:

    ```
    `-- windows-build-tools@2.2.1
      +-- chalk@2.3.2
      | +-- ansi-styles@3.2.1
      | | `-- color-convert@1.9.1
      | |   `-- color-name@1.1.3
    ...
    ```
4. Open up Command Prompt (type `cmd` in the search bar in the dock, and it will be the first result) and type in:

    ```
    cd %USERPROFILE%\.atom\packages\stata-exec
    npm install winax --python=%USERPROFILE%\.windows-build-tools\python27\python.exe
    atom -v
    ```

    Then enter the following, where you need to replace `ELECTRON_VERSION` with the text following "Electron" in the output of `atom -v`.

    ```
    npm rebuild winax --runtime=electron --target=ELECTRON_VERSION --disturl=https://atom.io/download/atom-shell --build-from-source
    ```

5. [Link the Stata Automation library](https://www.stata.com/automation/#install). The following steps worked for me on Windows 10. The Stata executable is most likely in the folder `C:\Program Files (x86)\Stata15`.

    > 1. In the installation directory, right-click on the Stata executable, for example, StataSE.exe. Choose "Create Shortcut".
    > 2. Right-click on the newly created "Shortcut to StataSE.exe", choose "Property", and change the Target from "C:\Program Files\Stata13\StataSE.exe" to "C:\Program Files\Stata13\StataSE.exe" /Register. Click "OK".
    > 3. Right-click on the updated "Shortcut to StataSE.exe"; choose "Run as administrator"

    While you're doing that, add the path of the Stata executable to the "Stata Path" option in the settings.

6. Restart Atom.

Now you can open up a Stata do-file and run code! See [Usage](#usage) for more details.

### Linux

Linux users must install [Autokey](https://github.com/autokey-py3/autokey). On Ubuntu, that's as simple as:
```
sudo add-apt-repository ppa:troxor/autokey
sudo apt update
sudo apt install autokey-gtk
```
You must then link the [stata-exec.py](./linux/stata-exec.py) file to your Autokey data directory. This is `~/.config/autokey/data/My Phrases` by default, so you can add the file to that directory with the command
```
ln -s ~/.atom/packages/stata-exec/linux/stata-exec.py ~/.config/autokey/data/My\ Phrases/
```
This only needs to be done once. (Creating a symlink ensures that the script is always the most up to date version.) Additionally, the autokey program must be running for code sending to work. To do this, open up a new terminal and run `autokey-gtk`; this process needs to be running each time you run code. (Alternatively, there's an option in Autokey's settings to start the program by default at login.)

## Usage

Code can be run using either the Command Palette or with keyboard shortcuts.

To open the Command Palette, press <kbd>cmd</kbd>-<kbd>shift</kbd>-<kbd>P</kbd> / <kbd>ctrl</kbd>-<kbd>shift</kbd>-<kbd>P</kbd>, and then start typing `Stata Exec`. The available commands will be shown in the drop-down menu.

The following are the default keyboard shortcuts (Mac / Windows and Linux). These can be personalized in your [`keymap.cson`](http://flight-manual.atom.io/behind-atom/sections/keymaps-in-depth/).

- <kbd>cmd</kbd>-<kbd>enter</kbd> / <kbd>ctrl</kbd>-<kbd>enter</kbd>: send selection or current line to Stata.
- <kbd>shift</kbd>-<kbd>cmd</kbd>-<kbd>D</kbd> / <kbd>shift</kbd>-<kbd>ctrl</kbd>-<kbd>D</kbd>: send entire file to Stata. (File must be saved first. This runs do "/path/to/current/file")
- <kbd>shift</kbd>-<kbd>alt</kbd>-<kbd>P</kbd> / <kbd>ctrl</kbd>-<kbd>alt</kbd>-<kbd>p</kbd>: send the previous command.
- <kbd>shift</kbd>-<kbd>cmd</kbd>-<kbd>C</kbd> / <kbd>shift</kbd>-<kbd>ctrl</kbd>-<kbd>C</kbd>: change Stata's working directory to that of current file.
- <kbd>shift</kbd>-<kbd>cmd</kbd>-<kbd>G</kbd> / <kbd>shift</kbd>-<kbd>ctrl</kbd>-<kbd>G</kbd>: send paragraph under current cursor. A paragraph is a region enclosed by whitespace.
- <kbd>shift</kbd>-<kbd>cmd</kbd>-<kbd>R</kbd> / <kbd>shift</kbd>-<kbd>ctrl</kbd>-<kbd>R</kbd>: send program definition under current cursor. If there exists `program drop` on the line before `program define`, the line including the former will be included in the selection. For example, all the lines in the below snippet would be sent to Stata:

    ```stata
    cap program drop myProgram
    program define myProgram
        // program contents
    end
    ```

## Configuration

All configuration can be done in the settings panel (Settings > Packages > stata-exec). The available options are listed below:

- Stata Path (used for Windows only)
    - Absolute path to Stata executable. The default setting will most likely need to be changed to reflect your install location and Stata flavor.
- Which App (used for macOS only)
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
    - If this and Advance Position are checked, after running a line the cursor will move to the next uncommented line.
- Paste Speed (used for XQuartz only)
    - This value changes the amount of time the program waits between switching to the XQuartz window, pasting code, and sending "enter". The only way to send code to XQuartz is to use the clipboard, and the responsiveness of this process will depend on the speed of your internet connection. If the copy-pasting isn't working, try increasing the value. Decreasing the value will run your code faster. Value must be between 0.1 and 10.

## Notes

### Troubleshooting and Known Issues
- _Do entire file_ doesn't run the last line of the do file.
    - Stata needs there to be a _newline_ character following the last line of text. Add an empty line to the end of the file and it'll work.
- On Linux, the Stata GUI window must be the only program open with a window title of `Stata/`
