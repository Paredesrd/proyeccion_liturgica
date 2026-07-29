import sys
from PyQt6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings
from PyQt6.QtCore import QUrl, Qt

HOST = "127.0.0.1"
PORT = 8000


class LiturgicalWindow(QMainWindow):
    def __init__(self, url: str, title: str, is_fullscreen: bool = False):
        super().__init__()
        self.setWindowTitle(title)

        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)

        self.web_view = QWebEngineView()
        layout.addWidget(self.web_view)

        settings = self.web_view.page().settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)

        self.web_view.setUrl(QUrl(url))

        if is_fullscreen:
            self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint)
            self.showFullScreen()
        else:
            self.resize(1280, 720)
            self.show()

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Escape:
            QApplication.instance().quit()


def run_desktop_app():
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)

    app.setQuitOnLastWindowClosed(True)

    # Ventana Control
    control_win = LiturgicalWindow(f"http://{HOST}:{PORT}/", "Panel de Control", False)

    # Ventana Proyector
    projector_win = LiturgicalWindow(f"http://{HOST}:{PORT}/projector", "Proyector", True)

    return app.exec()