import sys
from PyQt6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings
from PyQt6.QtCore import QUrl, Qt

# El cliente de escritorio siempre ataca al loopback local
CLIENT_HOST = "127.0.0.1"
PORT = 8000

class LiturgicalWindow(QMainWindow):
    def __init__(self, url: str, title: str, is_fullscreen: bool = False, target_screen=None):
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

        if target_screen:
            self.setScreen(target_screen)
            self.move(target_screen.geometry().topLeft())

        if is_fullscreen:
            self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
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

    screens = app.screens()
    num_screens = len(screens)

    if num_screens > 1:
        print(f"Topología detectada: {num_screens} monitores. Activando modo Producción.")
        control_screen = screens[0]
        projector_screen = screens[1]
        projector_fullscreen = True
    else:
        print("Topología detectada: 1 monitor. Activando modo Desarrollo (Windowed).")
        control_screen = screens[0]
        projector_screen = screens[0]
        projector_fullscreen = False

    control_win = LiturgicalWindow(
        url=f"http://{CLIENT_HOST}:{PORT}/",
        title="Panel de Control",
        is_fullscreen=False,
        target_screen=control_screen
    )

    projector_win = LiturgicalWindow(
        url=f"http://{CLIENT_HOST}:{PORT}/projector",
        title="Proyector",
        is_fullscreen=projector_fullscreen,
        target_screen=projector_screen
    )

    app.control_win = control_win
    app.projector_win = projector_win

    return app.exec()