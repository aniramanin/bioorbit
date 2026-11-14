# SI disclosure: written with the assistance of an AI coding assistant (Claude, Anthropic).
import subprocess, os, json, base64, time, tempfile
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
class CDP:
    def __init__(self):
        r1, w1 = os.pipe(); r2, w2 = os.pipe()
        def pre():
            os.dup2(r1, 3); os.dup2(w2, 4)
        self.p = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-pipe", "--no-first-run",
            "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--disable-gpu-vsync",
            "--user-data-dir=" + tempfile.mkdtemp(), "about:blank"],
            preexec_fn=pre, close_fds=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.close(r1); os.close(w2)
        self.w = os.fdopen(w1, "wb", buffering=0); self.r = os.fdopen(r2, "rb", buffering=0)
        self.buf = b""; self.id = 0; self.sid = None
        t = self.send("Target.createTarget", {"url": "about:blank"}, root=True)["targetId"]
        self.sid = self.send("Target.attachToTarget", {"targetId": t, "flatten": True}, root=True)["sessionId"]
        self.send("Page.enable"); self.send("Runtime.enable")
    def _read(self):
        while b"\0" not in self.buf:
            c = self.r.read(1 << 20)
            if not c: raise RuntimeError("chrome closed")
            self.buf += c
        m, self.buf = self.buf.split(b"\0", 1)
        return json.loads(m)
    def send(self, method, params=None, root=False):
        self.id += 1; msg = {"id": self.id, "method": method, "params": params or {}}
        if self.sid and not root: msg["sessionId"] = self.sid
        self.w.write(json.dumps(msg).encode() + b"\0")
        while True:
            m = self._read()
            if m.get("id") == self.id:
                if "error" in m: raise RuntimeError(f"{method}: {m['error']}")
                return m.get("result", {})
    def size(self, w, h, dpr=1, mobile=False):
        self.send("Emulation.setDeviceMetricsOverride", {"width": w, "height": h, "deviceScaleFactor": dpr, "mobile": mobile})
    def go(self, url, wait=1.0):
        self.send("Page.navigate", {"url": url}); time.sleep(wait)
    def js(self, expr):
        r = self.send("Runtime.evaluate", {"expression": expr, "awaitPromise": True, "returnByValue": True})
        return r.get("result", {}).get("value")
    def shot(self, path, fmt="png", q=92):
        p = {"format": fmt}
        if fmt == "jpeg": p["quality"] = q
        d = self.send("Page.captureScreenshot", p)["data"]
        open(path, "wb").write(base64.b64decode(d))
    def close(self):
        try: self.send("Browser.close", root=True)
        except Exception: pass
        self.p.wait(5)
