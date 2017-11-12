-- returns 0 if no windows found
-- returns 1 if successfully sent command
-- returns 2 if more than 1 window found and a RStudio window is not currently active
global shouldActivate

on runSafari(code, whichWindow, whichTab)
	-- code adapted from sublime package:
	-- https://github.com/randy3k/SendREPL
	tell application "Safari"
		if shouldActivate then
			activate
			-- having trouble figuring out how to raise the proper tab
			-- tell window whichWindow to set current tab to whichTab
			-- set current tab to whichTab
		end if
		set cmd to "
      var input = document.getElementById('rstudio_console_input');
      var textarea = input.getElementsByTagName('textarea')[0];
      textarea.value += \"" & code & "\";
      var e = document.createEvent('KeyboardEvent');
      e.initKeyboardEvent('input');
      textarea.dispatchEvent(e);
      var e = document.createEvent('KeyboardEvent');
      e.initKeyboardEvent('keydown');
      Object.defineProperty(e, 'keyCode', {'value' : 13});
      input.dispatchEvent(e);
    "
		tell tab whichTab of window whichWindow to do JavaScript cmd
	end tell
end runSafari

tell application "Safari"
	set currentTabName to name of front document
	if (currentTabName is "RStudio") then
		my runSafari(incoming, 1, index of current tab of window 1)
		return 1
	end if

	set potentialWindows to {}
	set windowCount to number of windows
	repeat with w from 1 to windowCount
		try
			set tabCount to number of tabs in window w
			repeat with t from 1 to tabCount
				set tabName to name of tab t of window w
				if (tabName is "RStudio") then
					set potentialWindows to potentialWindows & {{w, t, URL of tab t of window w}}
				end if
			end repeat
		on error msg
			-- intentionally empty
		end try
	end repeat

	if (count of potentialWindows) is 1 then
		set executeContext to item 1 of potentialWindows
		my runSafari(incoming, item 1 of executeContext, item 2 of executeContext)
		return 1
	else if (count of potentialWindows) is 0 then
		return 0
	end if

	return 2
end tell
