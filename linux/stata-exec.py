# Enter script code
import time
from os.path import expanduser, join
shortdelay = 0.2
current = window.get_active_title()

with open(join(expanduser('~'), '.stata-exec_code'), 'r') as f:
    cmd = f.read()

block_size = 100
cmd_blocks = [cmd[i:i + block_size] for i in range(0, len(cmd), block_size)]

window.activate("Stata/")

try:
    if window.wait_for_focus("Stata/(IC|SE|MP) 1[1-5].[0-2]", timeOut = 1):

        for block in cmd_blocks:
            time.sleep(shortdelay)
            keyboard.send_keys(block)

        time.sleep(shortdelay)
        keyboard.send_keys("<enter>")

        time.sleep(shortdelay)
        window.activate(current)
except TypeError:

    for block in cmd_blocks:
        time.sleep(shortdelay)
        keyboard.send_keys(block)

    time.sleep(shortdelay)
    keyboard.send_keys("<enter>")

    time.sleep(shortdelay)
    window.activate(current)
