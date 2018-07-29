"use strict";

const spawn = require('child_process').spawn;
const delay = require('delay');
const path = require('path');
const fs = require('fs');
const osascript = require('node-osascript');

if (process.platform == 'win32') {
  try {
    const os = require('os');
    var winaxPath = os.homedir() + "/.atom/packages/stata-exec/node_modules/winax";
    const winax = require(winaxPath);
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
  previousCommand: '',

  sendCode(code, batch=false) {
    console.log('entering sendCode function');
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

    this.previousCommand = code;
    switch (process.platform) {
      case 'darwin':
        return this.sendMac(code);
      case 'linux':
        return this.sendLinux(code);
      case 'win32':
        return this.sendWindows(code);
      default:
        return this.conditionalWarning('Unknown operating system.');
    }
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

  sendWindows(code) {
    if (code.length > 8192) {
      this.conditionalWarning('Code to send must be <= 8192 characters');
      return;
    }

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
        const editor = atom.workspace.getActiveTextEditor();
        var cwd = editor.getPath();
        var folderPath = cwd.substring(0, cwd.lastIndexOf('\\') + 1);
        this.con.DoCommandAsync('cd `"' + folderPath + '"\'');
        this.con.DoCommandAsync(code);
      });
  },

  sendMac(selection) {
    const whichApp = atom.config.get('stata-exec.whichApp');
    if (whichApp === 'XQuartz') {
      return this.sendXQuartz(selection);
    }

    if (selection.length > 8192) {
      this.conditionalWarning('Code to send must be <= 8192 characters');
      return;
    }

    const focusWindow = atom.config.get('stata-exec.focusWindow');
    var cmd = '';
    if (focusWindow) {
      cmd += `tell application "${whichApp}" to activate\n`;
    }
    cmd += `tell application "${whichApp}" to DoCommandAsync code`;

    return osascript.execute(cmd, { code: selection },
      function(err, result, raw) {
        if (err) {
          console.error(err);
          console.error('code: ', selection);
          return console.error('Applescript: ', cmd);
        }
      });
  },

  sendLinux(selection) {
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
        console.log(err);
        this.conditionalWarning('Home directory not writeable. Check permissions');
        return;
      }
      console.log('The file was saved!');
      exec(cmd, function(err, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (err) throw err;
      });
    });
  },

  sendXQuartz(selection) {
    const pasteSpeed = atom.config.get('stata-exec.pasteSpeed');
    const focusWindow = atom.config.get('stata-exec.focusWindow');
    var cmd = `
      set current_clipboard to the clipboard
      set the clipboard to (code as text)
      tell application "XQuartz" to activate
      delay 0.4 * ${pasteSpeed}
      tell application "System Events" to keystroke "v" using control down
      delay 0.9 * ${pasteSpeed}
      tell application "System Events" to keystroke return
      delay 0.1 * ${pasteSpeed}`;
    if (!focusWindow) {
      cmd += '\ntell application "Atom" to activate';
    }
    cmd += '\nset the clipboard to current_clipboard';

    return osascript.execute(cmd, { code: selection },
      function(err, result, raw) {
        if (err) {
          console.error(err);
          console.error('code: ', selection);
          return console.error('Applescript: ', cmd);
        }
      });
  }
};
