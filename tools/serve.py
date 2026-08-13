#!/usr/bin/env python3
"""Static server for the prep site with caching disabled.

python -m http.server answers conditional requests with 304s, which means edits to
content packs, CSS, or JS can appear not to take effect until a hard reload. This
serves the same files with Cache-Control: no-store so a normal refresh is enough.
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, keyword, value):
        # Drop validators so browsers cannot issue conditional requests at all.
        if keyword.lower() in ("last-modified", "etag"):
            return
        super().send_header(keyword, value)

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


def main():
    # An explicit argument wins; otherwise honour PORT so a harness can assign one
    # when 8777 is already taken.
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 8777))
    server = ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler)
    print(f"Android Interview Prep → http://localhost:{port}")
    print(f"Serving from: {ROOT}")
    print("Caching disabled — a normal refresh always picks up content changes.")
    print("Ctrl-C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
