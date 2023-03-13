'use strict';

const { spawn } = require('child_process');
const delay = require('delay');
const path = require('path');
const fs = require('fs');
const runApplescript = require('run-applescript');
const escapeString = require('escape-string-applescript');

module.exports = {
  previousCommand: '',
  winax: null,

  send(text, batch=false) {
    console.log('entering sendCode function');
    this.previousCommand = text;
    switch (process.platform) {
      case 'darwin':
        return this.sendMac(text);
      case 'linux':
        return this.sendLinux(text);
      case 'win32':
        return this.sendWindows(text);
      default:
        return this.error('Unknown operating system.');
    }
  },

  error(message) {
    console.error(message);
    return atom.notifications.addError(message);
  },

  defineWinax(){
    console.log('requiring winax')
    const os = require('os');
    var winaxPath = os.homedir();
    winaxPath += "/.atom/packages/stata-exec/node_modules/winax";
    try {
      return require(winaxPath);
    } catch (err) {
      console.error(err);
      atom.notifications.addError('Winax not correctly installed');
    }
  },

  sendWindows(text) {
    if (text.length > 8192) {
      this.error('Code to send must be <= 8192 characters');
      return;
    }

    if (!this.winax) {
      this.winax = this.defineWinax();
    }

    if (this.con) {
      return this.con.DoCommandAsync(text);
    }

    spawn(atom.config.get('stata-exec.stataPath'), { stdio: 'ignore', detached: true }).unref();
    return delay(2000)
      .then(() => {
        try {
          this.con = new this.winax.Object("stata.StataOLEApp", { // jshint ignore:line
            activate: true,
            async: true,
            type: true
          });
        } catch(err) {
          console.error(err);
          if (err.message.includes('Invalid class string')) {
            return this.error('Registering stata failed');
          }
        }
        const editor = atom.workspace.getActiveTextEditor();
        var cwd = editor.getPath();
        var folderPath = cwd.substring(0, cwd.lastIndexOf('\\') + 1);
        this.con.DoCommandAsync('cd `"' + folderPath + '"\'');
        this.con.DoCommandAsync(text);
      });
  },

  sendMac(text) {
    text = escapeString(text);
    const whichApp = atom.config.get('stata-exec.whichApp');
    if (whichApp === 'XQuartz') {
      return this.sendXQuartz(text);
    }

    if (text.length > 8192) {
      this.error('Code to send must be <= 8192 characters');
      return;
    }

    const focusWindow = atom.config.get('stata-exec.focusWindow');
    var cmd = '';
    if (focusWindow) {
      cmd += `tell application "${whichApp}" to activate\n`;
    }
    cmd += `tell application "${whichApp}" to DoCommandAsync "${text}"`;

    runApplescript(cmd)
      .then(() => {
        console.log('Finished applescript');
        console.log('code: ', text);
        return console.log('Applescript: ', cmd);
      }).catch((err) => {
        console.error(err);
        console.error('code: ', text);
        return console.error('Applescript: ', cmd);
      });
  },

  sendLinux(text) {
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
        windowactivate $stata_window \
        key --window $stata_window --clearmodifiers --delay 20 ctrl+v Return \
        windowactivate --sync $this_window;
      printf "$old_cb" | xclip -i -selection clipboard`;

    var codepath = path.join(process.env.HOME, '.stata-exec_code');
    fs.writeFile(codepath, text, function(err) {
      if(err) {
        console.log(err);
        this.error('Home directory not writeable. Check permissions');
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

  sendXQuartz(text) {
    const pasteSpeed = atom.config.get('stata-exec.pasteSpeed');
    const focusWindow = atom.config.get('stata-exec.focusWindow');
    var cmd = `
      set current_clipboard to the clipboard
      set the clipboard to ("${text}" as text)
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

    runApplescript(cmd)
      .then(() => {
        console.log('Finished applescript');
      }).catch((err) => {
        console.error(err);
        console.error('code: ', text);
        return console.error('Applescript: ', cmd);
      });
  }
};
