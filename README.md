# r-exec

Send R code from Atom to be executed in R.app, Terminal, iTerm, or a web browser running RStudio Server on Mac OS X.  The current selection is sent or in the case of no selection the current line is sent.

## Installation

`apm install r-exec`

or

Search for `r-exec` within package search in the Settings View.

## Configuration

### Keybindings

While `cmd-enter` is bound to sending code in the package, it is also annoyingly bound to entering a new line by default in atom.
In order to make it work, you must add the following binding in `~/.atom/keymap.cson`:

```javascript
'atom-workspace atom-text-editor:not([mini])':
  'cmd-enter': 'r-exec:send-command'
```

### Behavior

All configuration can be done in the settings panel. Alternatively, you can edit your configuration file as noted below.

In your global configuration file (`~/.atom/init.coffee`), you may set the following variables:

- `r-exec.whichApp` which R application to use. Valid applications are:
  - `R.app`: the default (the R GUI).
  - `RStudio`: the RStudio console.
  - `iTerm` or `Terminal`: Assumes the currently active terminal has R running.
  - `Safari` or `Google Chrome`: assumes the currently active tab has an active RStudio session running or only one session is open. If the session is not in the active tab, `r-exec` should be able to find it and still send the code. This is helpful if you are viewing plots full screen.
- `r-exec.advancePosition`
  - if `true`, go to the next line/paragraph after running the current line/paragraph.
  - if `false`, leave the cursor where it currently is
- `r-exec.focusWindow`.
  - if `true`, focus the window before sending code.
  - if `false`, send the code in the background and stay focused on Atom. This is not possible when sending code to a browser.
- `r-exec.notifications`
  - if `true`, notifications via `NotificationManager` when a paragraph or function is not identified.
- `r-exec.smartInsertOperator`
  - if `true` when inserting operators, only insert whitespace to the left or right of the operator if there is no existing whitespace.
- `r-exec.skipComments`
  - if `true` along with `r-exec.advancePosition`, skip comments after a command is run.

The default configuration looks like this:

```javascript
atom.config.set('r-exec.whichApp', 'R.app')
atom.config.set('r-exec.advancePosition', false)
atom.config.set('r-exec.skipComments', true)
atom.config.set('r-exec.focusWindow', true)
atom.config.set('r-exec.notifications', true)
atom.config.set('r-exec.smartInsertOperator', true)
```

#### Inserting operators

`r-exec` currently supports inserting the assignment (`<-`) and pipe (`%>%`) operators.
It tries to be smart by looking if there is whitespace to the left or the right of the cursor.
If there is already whitespace it will not insert additional whitespace.
Otherwise, it will insert whitespace.
This can be disabled in the settings tab (`Smart Insert Operator`).

### Notes about iTerm

The iTerm2 Applescript API recently changed as of version 3.0.0.
Older versions of iTerm2 (< 3.0.0) are supported using mode `iTerm`.
Newer versions of iTerm2 (>= 3.0.0) are supported using mode `iTerm2`.

## Usage

### Sending code

- `cmd-enter`: send code to configured application (`r-exec:whichApp`).
- `shift-cmd-e`: change to current working directory of current file.
- `shift-cmd-k`: send code between a knitr block (currently only RMarkdown supported).
- `shift-cmd-u`: send function under current cursor. Currently, only functions that begin of the first column in and on the first column of a line are sent. An example:
```r
myFunction <- function(x) {
  # my code goes here
}
```
- `shift-cmd-m`: send paragraph under current cursor. A paragraph is a region enclosed by whitespace.
- `shift-alt-p`: send the previous command.

### Inserting operators

- `alt--`: insert the assignment operator ` <- `
- `shift-alt-m`: insert the pipe operator ` %>% `

## Notes

It is currently Mac-only because these things are easy to do with AppleScript.  Any help on the Windows or Linux side would be great.

## TODO

- Error reporting.
- Support for Windows and Linux.
