import sys
from PyQt6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings, QWebEngineProfile
from PyQt6.QtCore import QUrl, Qt

from core.config import settings
from core.logger import log


class LiturgicalWindow(QMainWindow):
    def __init__(self, url: str, title: str, is_fullscreen: bool = False, target_screen=None):
        super().__init__()
        self.setWindowTitle(title)
        self.is_fullscreen_mode = is_fullscreen

        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)

        self.web_view = QWebEngineView()
        layout.addWidget(self.web_view)

        # Optimización de caché: Forzar uso de RAM en lugar de disco
        # Evita la degradación del SSD al reproducir videos de fondo de forma continua.
        profile = self.web_view.page().profile()
        profile.setHttpCacheType(QWebEngineProfile.HttpCacheType.MemoryHttpCache)

        # Configuraciones críticas de reproducción y seguridad del contenedor
        web_settings = self.web_view.page().settings()
        web_settings.setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)
        web_settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)

        self.web_view.setUrl(QUrl(url))

        if target_screen:
            self.setScreen(target_screen)
            self.move(target_screen.geometry().topLeft())

        if self.is_fullscreen_mode:
            self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
            self.showFullScreen()
        else:
            self.resize(1280, 720)
            self.show()

    def keyPressEvent(self, event):
        # Mitigación de riesgo: ESC desactiva el fullscreen para recuperar control,
        # pero NUNCA apaga el proceso principal. El cierre se hace desde la [X] nativa.
        if event.key() == Qt.Key.Key_Escape and self.is_fullscreen_mode:
            self.showNormal()
            self.is_fullscreen_mode = False
            log.info(f"Modo ventana activado manualmente mediante ESC para la ventana: {self.windowTitle()}")


def run_desktop_app():
    # Inyección de banderas Chromium de alto rendimiento ANTES de instanciar la interfaz
    sys.argv.extend([
        "--enable-gpu-rasterization",
        "--ignore-gpu-blocklist",
        "--enable-zero-copy",
        "--disable-software-rasterizer"
    ])

    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)

    app.setQuitOnLastWindowClosed(True)

    screens = app.screens()
    num_screens = len(screens)

    if num_screens > 1:
        log.info(f"Topología detectada: {num_screens} monitores. Desplegando en Producción.")
        control_screen = screens[0]
        projector_screen = screens[1]
        projector_fullscreen = True
    else:
        log.warning("Topología detectada: 1 monitor. Desplegando en Desarrollo (Modo Ventana).")
        control_screen = screens[0]
        projector_screen = screens[0]
        projector_fullscreen = False

    control_win = LiturgicalWindow(
        url=f"http://127.0.0.1:{settings.PORT}/",
        title="Panel de Control",
        is_fullscreen=False,
        target_screen=control_screen
    )

    projector_win = LiturgicalWindow(
        url=f"http://127.0.0.1:{settings.PORT}/projector",
        title="Proyector",
        is_fullscreen=projector_fullscreen,
        target_screen=projector_screen
    )

    # Mantener referencias para evitar la recolección de basura (Garbage Collector)
    app.control_win = control_win
    app.projector_win = projector_win

    return app.exec()