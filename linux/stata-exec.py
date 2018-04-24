# Enter script code
import time
from os.path import expanduser, join
shortdelay = 0.2
current = window.get_active_title()

window.activate("Stata/")

try:
    if window.wait_for_focus("Stata/(IC|SE|MP) 1[1-5].[0-2]", timeOut = 1):

        with open(join(expanduser('~'), '.stata-exec_code'), 'r') as f:
            cmd = f.read()

        time.sleep(shortdelay)
        keyboard.send_keys(cmd)
        keyboard.send_keys("<enter>")

        time.sleep(shortdelay)
        window.activate(current)
except TypeError:
    with open(join(expanduser('~'), '.stata-exec_code'), 'r') as f:
        cmd = f.read()

    time.sleep(shortdelay)
    keyboard.send_keys(cmd)
    keyboard.send_keys("<enter>")

    time.sleep(shortdelay)
    window.activate(current)
