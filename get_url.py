import subprocess
import sys
import os

os.environ['PYTHONUNBUFFERED'] = '1'

p = subprocess.Popen(
    ["gcloud.cmd", "auth", "application-default", "login", "--no-browser"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
)

while True:
    char = p.stdout.read(1)
    if not char:
        break
    sys.stdout.buffer.write(char)
    sys.stdout.buffer.flush()
