from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
PORT = 5173


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def do_GET(self):
        requested = self.translate_path(self.path)
        if self.path.startswith("/assets/") or os.path.exists(requested):
            return super().do_GET()

        self.path = "/index.html"
        return super().do_GET()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), SpaHandler)
    print(f"Serving {DIST} on http://127.0.0.1:{PORT}")
    server.serve_forever()
