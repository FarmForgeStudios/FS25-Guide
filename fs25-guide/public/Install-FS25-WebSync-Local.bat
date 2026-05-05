@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Detect language via PowerShell, default to EN if it fails
set "SYSLANG=en"
for /f "delims=" %%I in ('powershell -Command "(Get-Culture).TwoLetterISOLanguageName" 2^>nul') do set "SYSLANG=%%I"

:: Default (English)
set "L_TITLE1========================================================="
set "L_TITLE2=Installing FS25 WebSync (Local Server + Mod)"
set "L_TITLE3========================================================="
set "L_STEP1=[1/4] Creating server directory in:"
set "L_STEP2=[2/4] Copying web app from:"
set "L_ERR_APP=[ERROR] App source folder not found:"
set "L_ERR_APP_HINT=Please make sure the fs25-guide folder is in your Downloads."
set "L_BAT_CREATE=Creating launcher script..."
set "L_ERR_NODE=[ERROR] Node.js is not installed!"
set "L_ERR_NODE_HINT=The app requires Node.js. Please install from https://nodejs.org/"
set "L_DEP_INSTALL=Installing dependencies... This may take a while."
set "L_SRV_START1========================================================="
set "L_SRV_START2=Starting FS25 WebSync Server..."
set "L_SRV_START3=Leave this window open while playing."
set "L_SRV_START4========================================================="
set "L_STEP3=[3/4] Creating desktop shortcut..."
set "L_STEP4=[4/4] Installing mod FS25_WebSync_Mod..."
set "L_MOD_COMPRESS=Compressing and copying mod from:"
set "L_WARN_MOD=[WARNING] Mod source not found:"
set "L_WARN_MOD_HINT=Please zip and place it manually inside:"
set "L_DONE1========================================================="
set "L_DONE2=Installation completed successfully!"
set "L_DONE3=App installed in:"
set "L_DONE4=Mod installed in:"
set "L_DONE5=Use the desktop shortcut to start the server."
set "L_DONE6========================================================="

if /i "%SYSLANG%"=="fr" (
set "L_TITLE2=Installation de FS25 WebSync (Serveur Local + Mod)"
set "L_STEP1=[1/4] Creation du repertoire serveur dans :"
set "L_STEP2=[2/4] Copie de l'application web depuis :"
set "L_ERR_APP=[ERREUR] Le dossier source est introuvable :"
set "L_ERR_APP_HINT=Verifiez que fs25-guide est bien dans vos Telechargements."
set "L_BAT_CREATE=Creation du script de lancement..."
set "L_ERR_NODE=[ERREUR] Node.js n'est pas installe !"
set "L_ERR_NODE_HINT=L'application a besoin de Node.js (https://nodejs.org/)"
set "L_DEP_INSTALL=Installation des dependances... Cela peut prendre un moment."
set "L_SRV_START2=Serveur FS25 WebSync en cours de demarrage..."
set "L_SRV_START3=Laissez cette fenetre ouverte en jouant."
set "L_STEP3=[3/4] Creation du raccourci bureau..."
set "L_STEP4=[4/4] Installation du mod FS25_WebSync_Mod..."
set "L_MOD_COMPRESS=Compression et copie du mod depuis :"
set "L_WARN_MOD=[ATTENTION] Source du mod introuvable :"
set "L_WARN_MOD_HINT=Veuillez zipper et placer le mod manuellement dans :"
set "L_DONE2=Installation terminee avec succes !"
set "L_DONE3=Application installee dans :"
set "L_DONE4=Mod installe dans :"
set "L_DONE5=Utilisez le raccourci sur le bureau pour lancer le serveur."
)

if /i "%SYSLANG%"=="de" (
set "L_TITLE2=Installation von FS25 WebSync (Lokaler Server + Mod)"
set "L_STEP1=[1/4] Erstelle Server-Verzeichnis in:"
set "L_STEP2=[2/4] Kopiere Web-App von:"
set "L_ERR_APP=[FEHLER] App-Quellordner nicht gefunden:"
set "L_ERR_APP_HINT=Bitte stellen Sie sicher, dass sich fs25-guide in Ihren Downloads befindet."
set "L_BAT_CREATE=Erstelle Startskript..."
set "L_ERR_NODE=[FEHLER] Node.js ist nicht installiert!"
set "L_ERR_NODE_HINT=Die App benoetigt Node.js (https://nodejs.org/)"
set "L_DEP_INSTALL=Installiere Abhaengigkeiten... Dies kann eine Weile dauern."
set "L_SRV_START2=Starte FS25 WebSync Server..."
set "L_SRV_START3=Lassen Sie dieses Fenster beim Spielen geoeffnet."
set "L_STEP3=[3/4] Erstelle Desktop-Verknuepfung..."
set "L_STEP4=[4/4] Installiere Mod FS25_WebSync_Mod..."
set "L_MOD_COMPRESS=Komprimiere und kopiere Mod von:"
set "L_WARN_MOD=[WARNUNG] Mod-Quelle nicht gefunden:"
set "L_WARN_MOD_HINT=Bitte manuell zippen und platzieren in:"
set "L_DONE2=Installation erfolgreich abgeschlossen!"
set "L_DONE3=App installiert in:"
set "L_DONE4=Mod installiert in:"
set "L_DONE5=Benutzen Sie die Desktop-Verknuepfung, um den Server zu starten."
)

if /i "%SYSLANG%"=="es" (
set "L_TITLE2=Instalando FS25 WebSync (Servidor Local + Mod)"
set "L_STEP1=[1/4] Creando directorio del servidor en:"
set "L_STEP2=[2/4] Copiando aplicacion web desde:"
set "L_ERR_APP=[ERROR] Carpeta de origen de la aplicacion no encontrada:"
set "L_ERR_APP_HINT=Asegurese de que la carpeta fs25-guide este en sus Descargas."
set "L_BAT_CREATE=Creando script de lanzamiento..."
set "L_ERR_NODE=[ERROR] Node.js no esta instalado!"
set "L_ERR_NODE_HINT=La aplicacion requiere Node.js (https://nodejs.org/)"
set "L_DEP_INSTALL=Instalando dependencias... Esto puede tardar un poco."
set "L_SRV_START2=Iniciando el servidor FS25 WebSync..."
set "L_SRV_START3=Deje esta ventana abierta mientras juega."
set "L_STEP3=[3/4] Creando acceso directo en el escritorio..."
set "L_STEP4=[4/4] Instalando el mod FS25_WebSync_Mod..."
set "L_MOD_COMPRESS=Comprimiendo y copiando el mod desde:"
set "L_WARN_MOD=[ADVERTENCIA] Origen del mod no encontrado:"
set "L_WARN_MOD_HINT=Comprima y coloque manualmente el mod en:"
set "L_DONE2=Instalacion completada con exito!"
set "L_DONE3=Aplicacion instalada en:"
set "L_DONE4=Mod instalado en:"
set "L_DONE5=Usa el acceso directo en el escritorio para iniciar el servidor."
)

if /i "%SYSLANG%"=="it" (
set "L_TITLE2=Installazione FS25 WebSync (Server Locale + Mod)"
set "L_STEP1=[1/4] Creazione della directory del server in:"
set "L_STEP2=[2/4] Copia dell'app web da:"
set "L_ERR_APP=[ERRORE] Cartella di origine dell'app non trovata:"
set "L_ERR_APP_HINT=Assicurati che la cartella fs25-guide si trovi nei Download."
set "L_BAT_CREATE=Creazione dello script di avvio..."
set "L_ERR_NODE=[ERRORE] Node.js non e installato!"
set "L_ERR_NODE_HINT=L'applicazione richiede Node.js (https://nodejs.org/)"
set "L_DEP_INSTALL=Installazione delle dipendenze... Potrebbe volerci un po'."
set "L_SRV_START2=Avvio del Server FS25 WebSync..."
set "L_SRV_START3=Lascia aperta questa finestra mentre giochi."
set "L_STEP3=[3/4] Creazione del collegamento sul desktop..."
set "L_STEP4=[4/4] Installazione del mod FS25_WebSync_Mod..."
set "L_MOD_COMPRESS=Compressione e copia del mod da:"
set "L_WARN_MOD=[AVVISO] Origine del mod non trovata:"
set "L_WARN_MOD_HINT=Crea un file zip e posizionalo manualmente in:"
set "L_DONE2=Installazione completata con successo!"
set "L_DONE3=App installata in:"
set "L_DONE4=Mod installata in:"
set "L_DONE5=Usa il collegamento sul desktop per avviare il server."
)

if /i "%SYSLANG%"=="pt" (
set "L_TITLE2=Instalando FS25 WebSync (Servidor Local + Mod)"
set "L_STEP1=[1/4] Criando diretorio do servidor em:"
set "L_STEP2=[2/4] Copiando aplicativo da web de:"
set "L_ERR_APP=[ERRO] Pasta de origem do aplicativo nao encontrada:"
set "L_ERR_APP_HINT=Certifique-se de que a pasta fs25-guide esta em Downloads."
set "L_BAT_CREATE=Criando script de inicializacao..."
set "L_ERR_NODE=[ERRO] Node.js nao esta instalado!"
set "L_ERR_NODE_HINT=O aplicativo requer o Node.js (https://nodejs.org/)"
set "L_DEP_INSTALL=Instalando dependencias... Isso pode demorar um pouco."
set "L_SRV_START2=Iniciando Servidor FS25 WebSync..."
set "L_SRV_START3=Deixe esta janela aberta enquanto joga."
set "L_STEP3=[3/4] Criando atalho na area de trabalho..."
set "L_STEP4=[4/4] Instalando mod FS25_WebSync_Mod..."
set "L_MOD_COMPRESS=Comprimindo e copiando o mod de:"
set "L_WARN_MOD=[AVISO] Origem do mod nao encontrada:"
set "L_WARN_MOD_HINT=Comprima e coloque manualmente o mod em:"
set "L_DONE2=Instalacao concluida com sucesso!"
set "L_DONE3=App instalado em:"
set "L_DONE4=Mod instalado em:"
set "L_DONE5=Use o atalho para iniciar o servidor."
)

if /i "%SYSLANG%"=="pl" (
set "L_TITLE2=Instalacja FS25 WebSync (Lokalny Serwer + Mod)"
set "L_STEP1=[1/4] Tworzenie katalogu serwera w:"
set "L_STEP2=[2/4] Kopiowanie aplikacji webowej z:"
set "L_ERR_APP=[BLAD] Folder zrodlowy aplikacji nie zostal znaleziony:"
set "L_ERR_APP_HINT=Upewnij sie, ze folder fs25-guide znajduje sie w Pobranych."
set "L_BAT_CREATE=Tworzenie skryptu startowego..."
set "L_ERR_NODE=[BLAD] Node.js nie jest zainstalowany!"
set "L_ERR_NODE_HINT=Aplikacja wymaga Node.js (https://nodejs.org/)"
set "L_DEP_INSTALL=Instalacja zaleznosci... To moze potrwac."
set "L_SRV_START2=Uruchamianie serwera FS25 WebSync..."
set "L_SRV_START3=Zostaw to okno otwarte podczas gry."
set "L_STEP3=[3/4] Tworzenie skrotu na pulpicie..."
set "L_STEP4=[4/4] Instalacja modyfikacji FS25_WebSync_Mod..."
set "L_MOD_COMPRESS=Kompresja i kopiowanie modyfikacji z:"
set "L_WARN_MOD=[OSTRZEZENIE] Zrodlo modyfikacji nie znalezione:"
set "L_WARN_MOD_HINT=Spakuj i przenieś samodzielnie mod do:"
set "L_DONE2=Instalacja zakonczona pomyslnie!"
set "L_DONE3=Aplikacja zainstalowana w:"
set "L_DONE4=Mod zainstalowany w:"
set "L_DONE5=Uzyj skrotu na pulpicie, aby uruchomic serwer."
)

if /i "%SYSLANG%"=="ro" (
set "L_TITLE2=Instalare FS25 WebSync (Server Local + Mod)"
set "L_STEP1=[1/4] Crearea folderului server in:"
set "L_STEP2=[2/4] Copierea aplicatiei web din:"
set "L_ERR_APP=[EROARE] Folderul sursa al aplicatiei nu a fost gasit:"
set "L_ERR_APP_HINT=Asigurati-va ca folderul fs25-guide este in Descarcari."
set "L_BAT_CREATE=Crearea scriptului de pornire..."
set "L_ERR_NODE=[EROARE] Node.js nu este instalat!"
set "L_ERR_NODE_HINT=Aplicatia necesita Node.js (https://nodejs.org/)"
set "L_DEP_INSTALL=Instalarea dependentelor... Aceasta poate dura putin."
set "L_SRV_START2=Pornirea serverului FS25 WebSync..."
set "L_SRV_START3=Lasa aceasta fereastra deschisa in timp ce te joci."
set "L_STEP3=[3/4] Crearea unei scurtaturi pe desktop..."
set "L_STEP4=[4/4] Instalarea modului FS25_WebSync_Mod..."
set "L_MOD_COMPRESS=Comprimarea si copierea modului din:"
set "L_WARN_MOD=[AVERTISMENT] Sursa modului nu a fost gasita:"
set "L_WARN_MOD_HINT=Arhiveaza si muta manual modul in:"
set "L_DONE2=Instalarea a fost finalizata cu succes!"
set "L_DONE3=Aplicatia a fost instalata in:"
set "L_DONE4=Modul a fost instalat in:"
set "L_DONE5=Foloseste scurtatura de pe desktop pentru a porni serverul."
)

echo !L_TITLE1!
echo !L_TITLE2!
echo !L_TITLE1!
echo.

set "SOURCE_APP_DIR=C:\Users\Downloads\fs25-guide"
if not exist "%SOURCE_APP_DIR%" (
    set "SOURCE_APP_DIR=%USERPROFILE%\Downloads\fs25-guide"
)
set "INSTALL_DIR=%LOCALAPPDATA%\Guide_FS25"
set "MODS_DIR=C:\Users\Documents\My Games\FarmingSimulator2025\mods"
if not exist "C:\Users\Documents" (
    set "MODS_DIR=%USERPROFILE%\Documents\My Games\FarmingSimulator2025\mods"
)
set "MOD_ZIP=%MODS_DIR%\FS25_WebSync_Mod.zip"
set "SOURCE_MOD_DIR=%SOURCE_APP_DIR%\FS25_WebSync_Mod"

:: 1. Install Server
echo !L_STEP1! %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo !L_STEP2! %SOURCE_APP_DIR%...
if exist "%SOURCE_APP_DIR%" (
    xcopy "%SOURCE_APP_DIR%" "%INSTALL_DIR%" /E /I /Y
) else (
    echo !L_ERR_APP! %SOURCE_APP_DIR%
    echo !L_ERR_APP_HINT!
    pause
    exit /b
)

:: Create a launcher bat
echo !L_BAT_CREATE!
(
echo @echo off
echo title FS25 WebSync Serveur
echo cd /d "%%~dp0"
echo.
echo :: Verification de Node.js
echo node -v ^^>nul 2^^>^^^&1
echo if %%errorLevel%% neq 0 ^(
echo     echo !L_ERR_NODE!
echo     echo !L_ERR_NODE_HINT!
echo     pause
echo     exit /b
echo ^)
echo.
echo :: Installation des dependances
echo if not exist "node_modules" ^(
echo     echo !L_DEP_INSTALL!
echo     call npm install
echo ^)
echo.
echo :: Demarrage
echo echo !L_SRV_START1!
echo echo  !L_SRV_START2!
echo echo  !L_SRV_START3!
echo echo !L_SRV_START4!
echo call npm run dev
echo pause
) > "%INSTALL_DIR%\start.bat"

:: 2. Create Desktop Shortcut
echo !L_STEP3!
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\FS25 WebSync (Local).lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

:: 3. Install Mod
echo !L_STEP4!
if not exist "%MODS_DIR%" mkdir "%MODS_DIR%"

if exist "%SOURCE_MOD_DIR%" (
    echo !L_MOD_COMPRESS! %SOURCE_MOD_DIR%...
    powershell -Command "Compress-Archive -Path '%SOURCE_MOD_DIR%\*' -DestinationPath '%MOD_ZIP%' -Force"
) else (
    echo !L_WARN_MOD! %SOURCE_MOD_DIR%
    echo !L_WARN_MOD_HINT! %MOD_ZIP%
)

echo.
echo !L_DONE1!
echo !L_DONE2!
echo !L_DONE3! %INSTALL_DIR%
echo !L_DONE4! %MOD_ZIP%
echo !L_DONE5!
echo !L_DONE6!
pause
