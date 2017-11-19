/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {CompositeDisposable, Point, Range} = require('atom');

String.prototype.addSlashes = function() {
  return this.replace(/[\\"]/g, "\\$&").replace(/\u0000/g, "\\0");
};

const apps = {
  stataMP: 'StataMP',
  stataIC: 'StataIC',
  stataSE: 'StataSE',
  xquartz: 'XQuartz'
};

module.exports = {
  config: {
    whichApp: {
      type: 'string',
      enum: [apps.stataMP, apps.stataIC, apps.stataSE, apps.xquartz],
      default: apps.stataSE,
      description: 'Which application to send code to',
      order: 1
    },
    advancePosition: {
      type: 'boolean',
      default: false,
      order: 3,
      description: 'Cursor advances to the next line after ' +
        'sending the current line when there is no selection'
    },
    skipComments: {
      type: 'boolean',
      default: true,
      order: 4,
      description: 'When "advancePosition" is true, skip lines that contain ' +
        'only comments'
    },
    focusWindow: {
      type: 'boolean',
      default: true,
      order: 2,
      description: 'After code is sent, bring focus to where it was sent'
    },
    notifications: {
      type: 'boolean',
      default: true,
      order: 5,
      description: 'Try to send notifications if there is an error sending code'
    },
    pasteSpeed: {
      type: 'number',
      default: 1.0,
      minimum: 0.1,
      maximum: 10,
      order: 6,
      description: 'Copy-paste speed; Only used for XQuartz. The only way to send code to XQuartz is to put text on the clipboard, change to that window, and paste the text. The responsiveness of the copy-pasting depends on the speed of your internet connection. If the copy-pasting isn\'t working, try increasing the value. Decreasing the value will run your code faster. Value must be between 0.1 and 10.'
    }
  },

  subscriptions: null,

  previousCommand: '',

  activate(state) {
    this.subscriptions = new CompositeDisposable;

    this.subscriptions.add(atom.commands.add('atom-workspace',
      'stata-exec:send-command', () => this.sendCommand())
    );
    this.subscriptions.add(atom.commands.add('atom-workspace',
      'stata-exec:send-previous-command', () => this.sendPreviousCommand())
    );
    this.subscriptions.add(atom.commands.add('atom-workspace',
      'stata-exec:do-entire-file', () => this.doFile())
    );
    this.subscriptions.add(atom.commands.add('atom-workspace',
      {'stata-exec:send-paragraph': () => this.sendParagraph()})
    );
    this.subscriptions.add(atom.commands.add('atom-workspace',
      {'stata-exec:send-program': () => this.sendFunction()})
    );
    return this.subscriptions.add(atom.commands.add('atom-workspace',
      'stata-exec:set-working-directory', () => this.setWorkingDirectory())
    );
  },

  deactivate() {
    return this.subscriptions.dispose();
  },

  _getEditorAndBuffer() {
    const editor = atom.workspace.getActiveTextEditor();
    const buffer = editor.getBuffer();
    return [editor, buffer];
  },

  doFile() {
    const whichApp = atom.config.get('stata-exec.whichApp');
    const [editor, buffer] = Array.from(this._getEditorAndBuffer());
    const documentTitle = editor.getPath();
    if (!documentTitle) {
      console.error('Error: File not yet saved.');
      this.conditionalWarning('Error: File not yet saved.');
      return;
    }
    const doFileCommand = `do \`"${documentTitle}"'`;
    return this.sendCode(doFileCommand.addSlashes(), whichApp);
  },

  sendCommand() {
    const whichApp = atom.config.get('stata-exec.whichApp');
    const [editor, buffer] = Array.from(this._getEditorAndBuffer());
    // we store the current position so that we can jump back to it later
    // (if the user wants to)
    const currentPosition = editor.getLastSelection().getScreenRange().end;
    const selection = this.getSelection(whichApp);
    this.sendCode(this.removeComments(selection.selection), whichApp);

    const advancePosition = atom.config.get('stata-exec.advancePosition');
    if (advancePosition && !selection.anySelection) {
      let nextPosition = this._findForward(this.nonEmptyLine, currentPosition.row + 1);
      if (nextPosition != null) {
        if (nextPosition == null) { nextPosition = [currentPosition + 1, 0]; }
        editor.setCursorScreenPosition(nextPosition);
        return editor.moveToFirstCharacterOfLine();
      }
    } else {
      if (!selection.anySelection) {
        return editor.setCursorScreenPosition(currentPosition);
      }
    }
  },

  removeComments(code) {
    code = code.replace(/\s*(\/\/\/).*\n?\s*/g, " ");
    code = code.replace(/\s*\/\/.*/g, " ");
    code = code.replace(/\/\*([\s\S]*?)\*\//gm, " "); // flags = re.DOTALL
    code = code.replace(/[\t ]+/g, " ");
    return [code];
  },

  sendPreviousCommand() {
    const whichApp = atom.config.get('stata-exec.whichApp');
    return this.sendCode(this.previousCommand, whichApp);
  },

  sendCode(code, whichApp) {
    this.previousCommand = code;
    switch (whichApp) {
      case apps.stataIC: return this.stata(code, whichApp);
      case apps.stataMP: return this.stata(code, whichApp);
      case apps.stataSE: return this.stata(code, whichApp);
      case apps.xquartz: return this.xquartz(code);
      default: return console.error(`stata-exec.whichApp "${whichApp}" is not supported.`);
    }
  },

  getFunctionRange() {
    // gets the range of the closest function above the cursor.
    // if there is no (proper) function, return false
    const [editor, buffer] = Array.from(this._getEditorAndBuffer());
    const currentPosition = editor.getCursorBufferPosition();
    // search for the simple function that looks something like:
    // label <- function(...) {
    // in case the current function definition is on the current line
    currentPosition.row += 1;
    const backwardRange = [0, currentPosition];
    const funRegex = new
      RegExp(/^\s*(pr(ogram|ogra|ogr|og|o)?)\s+(de(fine|fin|fi|f)?\s+)?[A-Za-z_][A-Za-z0-9_]{0,31}/g);
    let foundStart = null;
    editor.backwardsScanInBufferRange(funRegex, backwardRange, function(result) {
      if (result.range.start.column === 0) {
        foundStart = result.range;
        return result.stop();
      }
    });

    if ((foundStart == null)) {
      console.error("Couldn't find the beginning of the function.");
      return null;
    }

    // now look for the end
    const numberOfLines = editor.getLineCount();
    const forwardRange = [foundStart.start, new Point(numberOfLines + 1, 0)];

    let foundEnd = null;
    editor.scanInBufferRange(/^\s*end/g, forwardRange, function(result) {
      if (result.range.start.column === 0) {
        foundEnd = result.range;
        return result.stop();
      }
    });

    if ((foundEnd == null)) {
      console.error("Couldn't find the end of the function.");
      return null;
    }

    // check if cursor is contained in range
    currentPosition.row -= 1;
    if ((foundStart.start.row <= currentPosition.row) &&
        (currentPosition.row <= foundEnd.start.row)) {
      return new Range(foundStart.start, foundEnd.end);
    } else {
      console.error("Couldn't find a function surrounding the current line.");
      console.error("start: ", foundStart);
      console.error("end: ", foundEnd);
      console.error("currentPosition: ", currentPosition);
      return null;
    }
  },

  sendFunction() {
    const [editor, buffer] = Array.from(this._getEditorAndBuffer());
    const whichApp = atom.config.get('stata-exec.whichApp');

    const range = this.getFunctionRange();
    if (range != null) {
      let code = editor.getTextInBufferRange(range);
      code = code.addSlashes();
      return this.sendCode(code, whichApp);
    } else {
      return this.conditionalWarning("Couldn't find function.");
    }
  },

  getSelection(whichApp) {
    // returns an object with keys:
    // selection: the selection or line at which the cursor is present
    // anySelection: if true, the user made a selection.
    const [editor, buffer] = Array.from(this._getEditorAndBuffer());

    let selection = editor.getLastSelection();
    let anySelection = true;

    if (selection.getText().addSlashes() === "") {
      anySelection = false;
      // editor.selectLinesContainingCursors()
      // selection = editor.getLastSelection()
      const currentPosition = editor.getCursorBufferPosition().row;
      selection = editor.lineTextForBufferRow(currentPosition);
    } else {
      selection = selection.getText();
    }
    selection = selection.addSlashes();

    return {selection, anySelection};
  },

  conditionalWarning(message) {
    const notifications = atom.config.get('stata-exec.notifications');
    if (notifications) {
      return atom.notifications.addWarning(message);
    }
  },

  onlyWhitespace(str) {
    // returns true if string is only whitespace
    return str.replace(/\s/g, '').length === 0;
  },

  getCurrentParagraphRange() {
    let lineIndex;
    const [editor, buffer] = Array.from(this._getEditorAndBuffer());
    const currentPosition = editor.getCursorBufferPosition().row;

    let currentLine = buffer.lineForRow(currentPosition);

    if (this.onlyWhitespace(currentLine)) {
      return null;
    }

    let startIndex = -1;
    // if we exhaust loop, then this paragraph begins at the first line
    if (currentPosition > 0) {
      let asc, start;
      for (start = currentPosition - 1, lineIndex = start, asc = start <= 0; asc ? lineIndex <= 0 : lineIndex >= 0; asc ? lineIndex++ : lineIndex--) {
        currentLine = buffer.lineForRow(lineIndex);
        if (this.onlyWhitespace(currentLine)) {
          startIndex = lineIndex;
          break;
        }
      }
    }
    startIndex += 1;

    let endIndex = editor.getLineCount();
    const numberOfLines = editor.getLineCount() - 1;
    if (currentPosition < (endIndex - 1)) {
      let asc1, end, start1;
      for (start1 = currentPosition + 1, lineIndex = start1, end = numberOfLines, asc1 = start1 <= end; asc1 ? lineIndex <= end : lineIndex >= end; asc1 ? lineIndex++ : lineIndex--) {
        currentLine = buffer.lineForRow(lineIndex);
        if (this.onlyWhitespace(currentLine)) {
          endIndex = lineIndex;
          break;
        }
      }
    }
    endIndex -= 1;

    const paragraphRange = new Range([startIndex, 0],
      [endIndex, buffer.lineLengthForRow(endIndex)]);

    return paragraphRange;
  },

  sendParagraph() {
    const whichApp = atom.config.get('stata-exec.whichApp');
    const [editor, buffer] = Array.from(this._getEditorAndBuffer());
    const paragraphRange = this.getCurrentParagraphRange();

    if (paragraphRange) {
      let code = editor.getTextInBufferRange(paragraphRange);
      code = code.addSlashes();
      this.sendCode(code, whichApp);
      const advancePosition = atom.config.get('stata-exec.advancePosition');
      if (advancePosition) {
        const currentPosition = editor.getLastSelection().getScreenRange().end;
        let nextPosition = this._findForward(this.nonEmptyLine, paragraphRange.end.row + 1);
        if (nextPosition != null) {
          if (nextPosition == null) { nextPosition = [currentPosition + 1, 0]; }
          editor.setCursorScreenPosition(nextPosition);
          return editor.moveToFirstCharacterOfLine();
        }
      }
    } else {
      console.error('No paragraph at cursor.');
      return this.conditionalWarning("No paragraph at cursor.");
    }
  },

  nonEmptyLine(line) {
    const skipComments = atom.config.get('stata-exec.skipComments');
    let ret = true;
    if (skipComments) {
      ret = !/^\s*#/.test(line);
    }
    // a non empty line is a line that doesn't contain only a comment
    // and at least 1 character
    return ret && /\S/.test(line);
  },

  _findForward(searchFun, startPosition = null) {
    const editor = atom.workspace.getActiveTextEditor();
    const buffer = editor.getBuffer();

    if ((startPosition == null)) {
      startPosition = editor.getCursorBufferPosition().row;
    }

    let index = null;
    const numberOfLines = editor.getLineCount() - 1;
    if (startPosition >= numberOfLines) {
      return null;
    }
    for (let lineIndex = startPosition, end = numberOfLines, asc = startPosition <= end; asc ? lineIndex <= end : lineIndex >= end; asc ? lineIndex++ : lineIndex--) {
      const currentLine = buffer.lineForRow(lineIndex);
      if (searchFun(currentLine)) {
        index = lineIndex;
        break;
      }
    }

    if (index != null) {
      return [index, buffer.lineLengthForRow(index)];
    }

    return null;
  },

  setWorkingDirectory() {
    // set the current working directory to the directory of
    // where the current file is
    const [editor, buffer] = Array.from(this._getEditorAndBuffer());
    const whichApp = atom.config.get('stata-exec.whichApp');
    // TODO: add warning if connected to server

    let cwd = editor.getPath();
    if (!cwd) {
      console.error('No current working directory (save the file first).');
      this.conditionalWarning('No current working directory (save the file first).');
      return;
    }
    cwd = cwd.substring(0, cwd.lastIndexOf('/'));
    cwd = `cd \`"${cwd}"'`;

    return this.sendCode(cwd.addSlashes(), whichApp);
  },

  stata(selection, whichApp) {
    const osascript = require('node-osascript');
    let command = [];
    const focusWindow = atom.config.get('stata-exec.focusWindow');
    if (focusWindow) {
      command.push(`tell application "${whichApp}" to activate`);
    }
    command.push(`tell application "${whichApp}" to DoCommandAsync code`);
    command = command.join('\n');

    return osascript.execute(command, {code: selection},
      function(error, result, raw) {
        if (error) {
          console.error(error);
          console.error('code: ', selection);
          return console.error('Applescript: ', command);
        }
    });
  },

  xquartz(selection) {
    const osascript = require('node-osascript');
    const pasteSpeed = atom.config.get('stata-exec.pasteSpeed');
    let command = [];
    const focusWindow = atom.config.get('stata-exec.focusWindow');
    command.push(`set current_clipboard to the clipboard`);
    command.push(`set the clipboard to (code as text)`);
    command.push(`tell application "XQuartz" to activate`);
    command.push(`delay 0.4 * ${pasteSpeed}`);
    command.push(`tell application "System Events" to keystroke "v" using control down`);
    command.push(`delay 0.9 * ${pasteSpeed}`);
    command.push(`tell application "System Events" to keystroke return`);
    command.push(`delay 0.1 * ${pasteSpeed}`);
    if (!focusWindow) {
      command.push(`tell application "Atom" to activate`);
    }
    command.push(`set the clipboard to current_clipboard`);
    command = command.join('\n');

    return osascript.execute(command, {code: selection},
      function(error, result, raw) {
        if (error) {
          console.error(error);
          console.error('code: ', selection);
          return console.error('Applescript: ', command);
        }
    });
  }
};
