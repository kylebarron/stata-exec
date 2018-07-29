"use strict";

const spawn = require('child_process').spawn;
const delay = require('delay');
const path = require('path');
const fs = require('fs');
const osascript = require('node-osascript');

if (process.platform == 'win32') {
  try {
    const os = require('os');
    var winax_path = os.homedir() + "/.atom/packages/stata-exec/node_modules/winax";
    const winax = require(winax_path);
  } catch (err) {
    console.error(err);
  }
}

String.prototype.addSlashes = function() {
  if (process.platform == 'darwin') {
    return this.replace(/[\\"]/g, "\\$&").replace(/\u0000/g, "\\0");
  } else if (process.platform == 'linux') {
    return this.replace(/\u0000/g, "\\0");
  } else {
    return this.replace(/\u0000/g, "\\0");
  }
};

module.exports = {
  _getEditorAndBuffer() {
    const editor = atom.workspace.getActiveTextEditor();
    const buffer = editor.getBuffer();
    return [editor, buffer];
  },

  previousCommand: '',

  sendCode(code, whichApp, batch=false) {
    console.log('entering sendCode function');
    const [editor, buffer] = this._getEditorAndBuffer();

    if (batch) {
      var codepath = path.join(process.env.HOME, '.stata-exec_batch_code');
      fs.writeFile(codepath, code, function(err) {
        if(err) {
          return console.log(err);
        }
        console.log(`The batch code was saved to ${codepath}!`);
        const doFileCommand = `do \`"${codepath}"'`;
        console.log(doFileCommand);
        console.log(doFileCommand.addSlashes());
        code = doFileCommand.addSlashes();
      });
    }
    else {
      // For interactive code (i.e. copy-pasted code) need to make sure there
      // are no block comments or ///.
      code = this.removeComments(code);
    }

    if (code.length > 8192 & (whichApp != "XQuartz" & process.platform != 'linux')) {
      this.conditionalWarning('Code selection must be fewer than 8192 characters');
      return;
    }

    this.previousCommand = code;
    if (process.platform == 'darwin') {
      console.log('this is macOS');
      if (whichApp == 'XQuartz') {
        return this.xquartz(code);
      }
      return this.stata_mac(code, whichApp);
    }

    if (process.platform == 'linux') {
      console.log('this is linux');
      return this.stata_linux(code);
    }

    if (process.platform == 'win32') {
      console.log('this is windows');
      if (this.con) {
        return this.con.DoCommandAsync(code);
      }

      spawn(atom.config.get('stata-exec.stataPath'), { stdio: 'ignore', detached: true }).unref();
      return delay(2000)
        .then(() => {
          this.con = new winax.Object("stata.StataOLEApp", { // jshint ignore:line
            activate: true,
            async: true,
            type: true
          });
          var cwd = editor.getPath();
          var folder_path = cwd.substring(0, cwd.lastIndexOf('\\') + 1);
          this.con.DoCommandAsync('cd `"' + folder_path + '"\'');
          this.con.DoCommandAsync(code);
        });
    }

    return this.conditionalWarning('Unknown operating system.');
  },

  conditionalWarning(message) {
    console.error(message);
    const notifications = atom.config.get('stata-exec.notifications');
    if (notifications) {
      return atom.notifications.addWarning(message);
    }
  },

  removeComments(code) {
    console.log('code with comments: ' + code);
    code = code.replace(/((["'])(?:\\[\s\S]|.)*?\2|(?:[^\w\s]|^)\s*\/(?![*\/])(?:\\.|\[(?:\\.|.)\]|.)*?\/(?=[gmiy]{0,4}\s*(?![*\/])(?:\W|$)))|\/\/\/.*?\r?\n\s*|\/\/.*?$|\/\*[\s\S]*?\*\//gm, '$1');
    // https://stackoverflow.com/questions/24518020/comprehensive-regexp-to-remove-javascript-comments
    // Using the "Final Boss Fight" at the bottom. Otherwise it fails on `di 5 / 5 // hello`
    // code = code.replace(';', '')
    if (process.platform == 'win32') {
      code = code + '\r';
    }
    console.log('code without comments: ' + code);
    return code;
  },

  stata_mac(selection, whichApp) {
    let command = [];
    const focusWindow = atom.config.get('stata-exec.focusWindow');
    if (focusWindow) {
      command.push(`tell application "${whichApp}" to activate`);
    }
    command.push(`tell application "${whichApp}" to DoCommandAsync code`);
    command = command.join('\n');

    return osascript.execute(command, { code: selection },
      function(err, result, raw) {
        if (err) {
          console.error(err);
          console.error('code: ', selection);
          return console.error('Applescript: ', command);
        }
      });
  },

  stata_linux(selection) {
    var exec = require('child_process').exec;
    // The `keyup ctrl` is the most important part of this
    //
    // The --clearmodifiers flag doesn't work great. By default, I have most of
    // the run keys bound with a `ctrl` key. I.e. to run a line of code you'd
    // type `ctrl+enter`. But when `ctrl` is held down by the user, running
    // `ctrl+v` pastes only `v`, and doesn't paste the clipboard. To prevent
    // against this, I use `keyup ctrl`, which forces the beginning position of
    // `ctrl` to be not pressed, regardless of what the user is doing.
    var cmd = `
      old_cb="$(xclip -o -selection clipboard)";
      this_window="$(xdotool getactivewindow)" &&
      stata_window="$(xdotool search --name --limit 1 "Stata/(IC|SE|MP)? 1[0-9]\.[0-9]")" &&
      cat ~/.stata-exec_code | xclip -i -selection clipboard &&
      xdotool \
        keyup ctrl shift \
        windowactivate --sync $stata_window \
        key --clearmodifiers --delay 100 ctrl+v Return \
        windowactivate --sync $this_window;
      printf "$old_cb" | xclip -i -selection clipboard`;

    var codepath = path.join(process.env.HOME, '.stata-exec_code');
    fs.writeFile(codepath, selection, function(err) {
      if(err) {
        return console.log(err);
      }

      console.log('The file was saved!');
      exec(cmd, function(err, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (err) throw err;
      });
    });
  },

  xquartz(selection) {
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

    return osascript.execute(command, { code: selection },
      function(err, result, raw) {
        if (err) {
          console.error(err);
          console.error('code: ', selection);
          return console.error('Applescript: ', command);
        }
      });
  }
};
