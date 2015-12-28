#!/usr/bin/python

import os, signal, time
import cgi
import cgitb

cgitb.enable()

print "Content-type: text/html"
print
print "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
print "<!DOCTYPE html>"
print "<html>"
print "<body>"
print "<a href='/car'>/car</a><hr>"
print "<pre>"

pids = [pid for pid in os.listdir('/proc') if pid.isdigit()]
for pid in pids:
    try:
        pname = open(os.path.join('/proc', pid, 'cmdline'), 'rb').read()
        if pname.startswith("mjpg_streamer"):
            print "mjpg_streamer is already running, kill it"
            os.kill(int(pid), signal.SIGKILL)
            time.sleep(3)
        if pname.startswith("node") and pname.find("fpvcarsrv.js")>0:
            print "node server is already running, kill it"
            os.kill(int(pid), signal.SIGKILL)
            time.sleep(3)
    except IOError:
        continue

resolution = "320x240"
fps = 15

form = cgi.FieldStorage()
if "r" in form:
    resolution = form["r"].value
if "f" in form:
    fps = int(form["f"].value)

print "starting mjpeg streamer (%s, %d)..." % (resolution, fps), 
mjpg_cmd = r'mjpg_streamer -i "input_uvc.so -d /dev/video0 -r %s -f %d" -o "output_http.so -p 8080 -w /www/webcam" &'
os.system(mjpg_cmd % (resolution, fps))
print "done"

print "starting node server ...",
os.system("node /root/fpvcarsrv.js > /root/fpv.log &")
print "done"

print "</pre></body>"
print "</html>"
