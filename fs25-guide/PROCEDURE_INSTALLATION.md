#Français(FR)
# Guide Complet : Installation et Utilisation de FS25 WebSync

Ce guide vous explique pas à pas comment installer l'application, lancer le serveur, et synchroniser les données de votre partie Farming Simulator 25.

---

## Étape 1 : Installation du Serveur et du Mod

1. **Extrayez** le contenu du `.zip` dans votre dossier `Téléchargements` (vous devriez obtenir un dossier nommé `fs25-guide`).
2. Allez dans le dossier `fs25-guide/public` et **double-cliquez sur le fichier `Install-FS25-WebSync-Local.bat`**.
3. Une fenêtre noire va s'ouvrir. Le script va automatiquement :
   - Copier les fichiers du serveur dans votre dossier local (`%LOCALAPPDATA%\Guide_FS25`).
   - Créer un raccourci **"FS25 WebSync (Local)"** sur votre bureau.
   - Zipper et installer le mod `FS25_WebSync_Mod.zip` directement dans votre dossier de mods Farming Simulator 25 (`Documents\My Games\FarmingSimulator2025\mods`).

---

## Étape 2 : Démarrage du Serveur

1. Double-cliquez sur le raccourci **"FS25 WebSync (Local)"** présent sur votre bureau.
2. La première fois, le script vérifiera que **Node.js** est installé. S'il ne l'est pas, il vous demandera de le télécharger sur [nodejs.org](https://nodejs.org/).
3. Le script va ensuite installer les dépendances nécessaires (cela peut prendre 1 à 2 minutes la première fois).
4. Une fois démarré, la console affichera les adresses pour accéder à l'application :
   - **URL d'accès local** : `http://localhost:3000` (pour ouvrir le guide sur le PC où vous jouez).
   - **URL d'accès réseau** : `http://192.168.X.X:3000` (pour ouvrir le guide sur une tablette ou un téléphone connecté au même réseau Wi-Fi).
5. ⚠️ **Laissez cette fenêtre noire ouverte** pendant toute votre session de jeu. Pour l'arrêter, fermez simplement la fenêtre.

---

## Étape 3 : Synchronisation des données (Le fichier `data.json`)

Il y a **deux méthodes** pour que l'application lise les données de votre partie (le fichier `data.json`) :

### Méthode 1 : Synchronisation Automatique (Recommandée)
C'est la méthode la plus simple si vous jouez à FS25 et faites tourner le serveur sur le **même PC**.

1. Lancez Farming Simulator 25 et **cochez le mod "FS25 WebSync"** avant de lancer votre sauvegarde.
2. Dès que vous êtes en jeu, le mod va automatiquement créer et mettre à jour le fichier `data.json` dans le dossier `Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\`.
3. Le serveur Node.js (que vous avez lancé via le raccourci) est programmé pour **détecter et lire automatiquement** ce fichier en arrière-plan.
4. Ouvrez l'application web sur votre navigateur (PC, tablette ou smartphone) : les données (champs, silos, finances) se mettront à jour toutes les quelques secondes **sans aucune action de votre part** !

### Méthode 2 : Importation Manuelle
Utilisez cette méthode si la synchronisation automatique ne fonctionne pas, ou si vous jouez sur un serveur dédié / un autre PC.

1. Récupérez le fichier `data.json` généré par le mod. Il se trouve dans :
   `Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\data.json` (sur le PC où tourne le jeu).
2. Ouvrez l'application web FS25 WebSync dans votre navigateur.
3. Allez dans l'onglet **Carte** (Map).
4. En haut à droite de la carte, cliquez sur le bouton **"Importer data.json manuellement"** (l'icône de dossier).
5. Sélectionnez votre fichier `data.json`.
6. Les données de l'application se mettront à jour instantanément avec le contenu du fichier. Vous devrez répéter cette opération pour rafraîchir les données.

⚠️⚠️IMPORTANT : Pour pouvoir profité de l'assistant ia sur l'application web, il faut que vous créez un fichier .env avec à l'intérieur votre clé_api gemini ou autre. 
Voici la ligne a copier/coller dans le fichier .env : GEMINI_API_KEY=VOTRE_CLE_API
Remplacer "VOTRE_CLE_API" par votre clé.
Ensuite mettez ce fichier dans "C:\Users\AppData\Local\Guide_FS25"


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#English(EN)
# Complete Guide: Installing and Using FS25 WebSync

This guide explains step-by-step how to install the application, launch the server, and synchronize your Farming Simulator 25 game data.

---

## Step 1: Server and Mod Installation

1. **Extract** the contents of the `.zip` file to your `Downloads` folder (you should get a folder named `fs25-guide`).

2. Go to the `fs25-guide/public` folder and **double-click the `Install-FS25-WebSync-Local.bat` file**.

3. A black window will open. The script will automatically:

- Copy the server files to your local folder (`%LOCALAPPDATA%\Guide_FS25`).

- Create a shortcut **"FS25 WebSync (Local)"** on your desktop.

- Zip and install the `FS25_WebSync_Mod.zip` directly into your Farming Simulator 25 mods folder (`Documents\My Games\FarmingSimulator2025\mods`).

---

## Step 2: Starting the Server

1. Double-click the **"FS25 WebSync (Local)"** shortcut on your desktop.

2. The first time, the script will check that **Node.js** is installed. If it isn't, it will ask you to download it from [nodejs.org](https://nodejs.org/).

3. The script will then install the necessary dependencies (this may take 1 to 2 minutes the first time).

4. Once started, the console will display the addresses to access the application:

- **Local access URL**: `http://localhost:3000` (to open the guide on the PC where you are playing).

- **Network access URL**: `http://192.168.X.X:3000` (to open the guide on a tablet or phone connected to the same Wi-Fi network).

5. ⚠️ **Leave this black window open** for the duration of your game session. To close it, simply close the window.

---

## Step 3: Data Synchronization (The `data.json` File)

There are **two methods** for the application to read your game data (the `data.json` file):

### Method 1: Automatic Synchronization (Recommended)
This is the simplest method if you are playing FS25 and running the server on the **same PC**.

1. Launch Farming Simulator 25 and **check the "FS25 WebSync" mod** before loading your save.

2. As soon as you are in-game, the mod will automatically create and update the `data.json` file in the `Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\` folder.

3. The Node.js server (which you launched via the shortcut) is programmed to **automatically detect and read** this file in the background.

4. Open the web application in your browser (PC, tablet, or smartphone): the data (fields, silos, finances) will update every few seconds **without any action required from you**!

### Method 2: Manual Import
Use this method if automatic synchronization doesn't work, or if you are playing on a dedicated server/another PC.

1. Retrieve the `data.json` file generated by the mod. It is located in:

`Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\data.json` (on the PC where the game is running).

2. Open the FS25 WebSync web application in your browser.

3. Go to the **Map** tab.

4. In the upper right corner of the map, click the **"Import data.json manually"** button (the folder icon).

5. Select your `data.json` file.

6. The application data will update instantly with the contents of the file. You will need to repeat this process to refresh the data.

⚠️⚠️IMPORTANT: To use the AI ​​assistant on the web application, you must create a .env file containing your Gemini API key (or other API key).

Here is the line to copy/paste into the .env file: GEMINI_API_KEY=YOUR_API_KEY
Replace "YOUR_API_KEY" with your API key.

Then place this file in "C:\Users\AppData\Local\Guide_FS25"
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#Deutsch(DE)
# Vollständige Anleitung: Installation und Verwendung von FS25 WebSync

Diese Anleitung erklärt Schritt für Schritt, wie Sie die Anwendung installieren, den Server starten und Ihre Spieldaten von Farming Simulator 25 synchronisieren.

---

## Schritt 1: Installation des Servers und der Mod

1. **Entpacken Sie** den Inhalt der ZIP-Datei in Ihren Download-Ordner (Sie erhalten einen Ordner namens „fs25-guide“).

2. Öffnen Sie den Ordner „fs25-guide/public“ und **doppelklicken Sie auf die Datei „Install-FS25-WebSync-Local.bat“**.

3. Ein schwarzes Fenster öffnet sich. Das Skript führt automatisch folgende Schritte aus:

- Kopieren der Serverdateien in Ihren lokalen Ordner („%LOCALAPPDATA%\Guide_FS25“).

- Erstellen einer Verknüpfung „FS25 WebSync (Lokal)“ auf Ihrem Desktop.

- Komprimieren Sie die Datei `FS25_WebSync_Mod.zip` und installieren Sie sie direkt in Ihrem Farming Simulator 25-Mods-Ordner (`Dokumente\Meine Spiele\FarmingSimulator2025\mods`).

---

## Schritt 2: Server starten

1. Doppelklicken Sie auf die Verknüpfung **"FS25 WebSync (Lokal)"** auf Ihrem Desktop.

2. Beim ersten Start prüft das Skript, ob **Node.js** installiert ist. Falls nicht, werden Sie aufgefordert, es von [nodejs.org](https://nodejs.org/) herunterzuladen.

3. Das Skript installiert anschließend die benötigten Abhängigkeiten (dies kann beim ersten Mal 1 bis 2 Minuten dauern).

4. Nach dem Start zeigt die Konsole die Adressen für den Zugriff auf die Anwendung an:

- **Lokale Zugriffs-URL**: `http://localhost:3000` (um die Anleitung auf dem PC zu öffnen, auf dem Sie spielen).

- **Netzwerkzugriffs-URL**: `http://192.168.X.X:3000` (um die Anleitung auf einem Tablet oder Smartphone im selben WLAN-Netzwerk zu öffnen).

5. ⚠️ **Lassen Sie dieses schwarze Fenster während Ihrer gesamten Spielsitzung geöffnet**. Zum Schließen schließen Sie einfach das Fenster.

---

## Schritt 3: Datensynchronisierung (Die `data.json`-Datei)

Es gibt **zwei Methoden**, mit denen die Anwendung Ihre Spieldaten (die `data.json`-Datei) lesen kann:

### Methode 1: Automatische Synchronisierung (Empfohlen)
Dies ist die einfachste Methode, wenn Sie FS25 spielen und den Server auf dem **gleichen PC** betreiben.

1. Starten Sie Farming Simulator 25 und **aktivieren Sie den Mod "FS25 WebSync"**, bevor Sie Ihren Spielstand laden.

2. Sobald du im Spiel bist, erstellt und aktualisiert die Mod automatisch die Datei `data.json` im Ordner `Dokumente\Meine Spiele\FarmingSimulator2025\modSettings\FS25_WebSync\`.

3. Der Node.js-Server (den du über die Verknüpfung gestartet hast) ist so programmiert, dass er diese Datei **automatisch erkennt und liest**.

4. Öffne die Webanwendung in deinem Browser (PC, Tablet oder Smartphone): Die Daten (Felder, Silos, Finanzen) werden alle paar Sekunden aktualisiert – ganz ohne dein Zutun!

### Methode 2: Manueller Import
Verwende diese Methode, wenn die automatische Synchronisierung nicht funktioniert oder wenn du auf einem dedizierten Server/einem anderen PC spielst.

1. Lade die von der Mod generierte Datei `data.json` herunter. Sie befindet sich hier:

`Dokumente\Meine Spiele\FarmingSimulator2025\modSettings\FS25_WebSync\data.json` (auf dem PC, auf dem das Spiel läuft).

2. Öffnen Sie die FS25 WebSync-Webanwendung in Ihrem Browser.

3. Wechseln Sie zum Tab **Karte**.

4. Klicken Sie oben rechts auf der Karte auf die Schaltfläche **„data.json manuell importieren“** (das Ordnersymbol).

5. Wählen Sie Ihre Datei `data.json` aus.

6. Die Anwendungsdaten werden sofort mit dem Inhalt der Datei aktualisiert. Sie müssen diesen Vorgang wiederholen, um die Daten zu aktualisieren.

⚠️⚠️WICHTIG: Um den KI-Assistenten in der Webanwendung zu nutzen, müssen Sie eine .env-Datei mit Ihrem Gemini-API-Schlüssel (oder einem anderen API-Schlüssel) erstellen.

Hier ist die Zeile, die Sie in die .env-Datei kopieren/einfügen müssen: GEMINI_API_KEY=IHR_API_SCHLÜSSEL
Ersetzen Sie "IHR_API_SCHLÜSSEL" durch Ihren API-Schlüssel.

Speichern Sie diese Datei anschließend unter "C:\Users\AppData\Local\Guide_FS25".
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#Espanol(ES)
# Guía completa: Instalación y uso de FS25 WebSync

Esta guía explica paso a paso cómo instalar la aplicación, iniciar el servidor y sincronizar los datos de tu juego Farming Simulator 25.

--

## Paso 1: Instalación del servidor y el mod

1. **Extrae** el contenido del archivo `.zip` en tu carpeta `Descargas` (deberías obtener una carpeta llamada `fs25-guide`).

2. Ve a la carpeta `fs25-guide/public` y **haz doble clic en el archivo `Install-FS25-WebSync-Local.bat`**.

3. Se abrirá una ventana negra. El script realizará automáticamente lo siguiente:

- Copiará los archivos del servidor a tu carpeta local (`%LOCALAPPDATA%\Guide_FS25`).

- Creará un acceso directo **"FS25 WebSync (Local)"** en tu escritorio.

- Comprime e instala el archivo `FS25_WebSync_Mod.zip` directamente en la carpeta de mods de Farming Simulator 25 (`Documentos\Mis juegos\FarmingSimulator2025\mods`).

--

## Paso 2: Iniciar el servidor

1. Haz doble clic en el acceso directo **"FS25 WebSync (Local)"** en tu escritorio.

2. La primera vez, el script comprobará que **Node.js** esté instalado. Si no lo está, te pedirá que lo descargues desde [nodejs.org](https://nodejs.org/).

3. El script instalará las dependencias necesarias (esto puede tardar de 1 a 2 minutos la primera vez).

4. Una vez iniciado, la consola mostrará las direcciones para acceder a la aplicación:

- **URL de acceso local**: `http://localhost:3000` (para abrir la guía en el PC donde estás jugando).

- **URL de acceso a la red**: `http://192.168.X.X:3000` (para abrir la guía en una tableta o teléfono conectado a la misma red Wi-Fi).

5. ⚠️ **Deja esta ventana negra abierta** durante toda tu sesión de juego. Para cerrarla, simplemente cierra la ventana.

--

## Paso 3: Sincronización de datos (Archivo `data.json`)

Existen **dos métodos** para que la aplicación lea los datos de tu juego (el archivo `data.json`):

### Método 1: Sincronización automática (Recomendado)
Este es el método más sencillo si juegas a FS25 y ejecutas el servidor en el **mismo PC**.

1. Inicia Farming Simulator 25 y **activa el mod "FS25 WebSync"** antes de cargar tu partida guardada.

2. En cuanto entres al juego, el mod creará y actualizará automáticamente el archivo `data.json` en la carpeta `Documentos\Mis juegos\FarmingSimulator2025\modSettings\FS25_WebSync\`.

3. El servidor Node.js (que iniciaste mediante el acceso directo) está programado para **detectar y leer** automáticamente este archivo en segundo plano.

4. Abre la aplicación web en tu navegador (PC, tableta o smartphone): ¡los datos (campos, silos, finanzas) se actualizarán cada pocos segundos **sin que tengas que hacer nada**!

### Método 2: Importación manual
Usa este método si la sincronización automática no funciona o si juegas en un servidor dedicado/otro PC.

1. Recupera el archivo `data.json` generado por el mod. Se encuentra en:

`Documentos\Mis juegos\FarmingSimulator2025\modSettings\FS25_WebSync\data.json` (en el PC donde se ejecuta el juego).

2. Abre la aplicación web FS25 WebSync en tu navegador.

3. Ve a la pestaña **Mapa**.

4. En la esquina superior derecha del mapa, haz clic en el botón **"Importar data.json manualmente"** (el icono de la carpeta).

5. Selecciona tu archivo `data.json`.

6. Los datos de la aplicación se actualizarán instantáneamente con el contenido del archivo. Deberás repetir este proceso para actualizar los datos.

⚠️⚠️IMPORTANTE: Para usar el asistente de IA en la aplicación web, debes crear un archivo .env que contenga tu clave API de Gemini (u otra clave API).

Esta es la línea que debes copiar y pegar en el archivo .env: GEMINI_API_KEY=TU_CLAVE_API
Reemplaza "TU_CLAVE_API" con tu clave API.

Luego, coloca este archivo en "C:\Users\AppData\Local\Guide_FS25"
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#Italinao(IT)
# Guida completa: Installazione e utilizzo di FS25 WebSync

Questa guida spiega passo passo come installare l'applicazione, avviare il server e sincronizzare i dati di gioco di Farming Simulator 25.

---

## Passaggio 1: Installazione del server e della mod

1. **Estrai** il contenuto del file `.zip` nella cartella `Download` (dovresti ottenere una cartella chiamata `fs25-guide`).

2. Vai alla cartella `fs25-guide/public` e **fai doppio clic sul file `Install-FS25-WebSync-Local.bat`**.

3. Si aprirà una finestra nera. Lo script eseguirà automaticamente le seguenti operazioni:

- Copia i file del server nella tua cartella locale (`%LOCALAPPDATA%\Guide_FS25`).

- Crea un collegamento **"FS25 WebSync (Locale)"** sul desktop.


- Comprimi e installa il file `FS25_WebSync_Mod.zip` direttamente nella cartella delle mod di Farming Simulator 25 (`Documenti\My Games\FarmingSimulator2025\mods`).

---

## Passaggio 2: Avvio del server

1. Fai doppio clic sul collegamento **"FS25 WebSync (Local)"** sul desktop.

2. La prima volta, lo script verificherà che **Node.js** sia installato. In caso contrario, ti chiederà di scaricarlo da [nodejs.org](https://nodejs.org/).

3. Lo script installerà quindi le dipendenze necessarie (la prima volta potrebbero essere necessari da 1 a 2 minuti).

4. Una volta avviato, la console visualizzerà gli indirizzi per accedere all'applicazione:

- **URL di accesso locale**: `http://localhost:3000` (per aprire la guida sul PC in cui stai giocando).

- **URL di accesso alla rete**: `http://192.168.X.X:3000` (per aprire la guida su un tablet o telefono connesso alla stessa rete Wi-Fi).

5. ⚠️ **Lascia questa finestra nera aperta** per tutta la durata della sessione di gioco. Per chiuderla, è sufficiente chiudere la finestra.

---

## Passaggio 3: Sincronizzazione dei dati (il file `data.json`)

Esistono **due metodi** per consentire all'applicazione di leggere i dati di gioco (il file `data.json`):

### Metodo 1: Sincronizzazione automatica (consigliato)
Questo è il metodo più semplice se giochi a FS25 e il server è in esecuzione sullo **stesso PC**.

1. Avvia Farming Simulator 25 e **seleziona la mod "FS25 WebSync"** prima di caricare il salvataggio.


2. Non appena avvii il gioco, la mod creerà e aggiornerà automaticamente il file `data.json` nella cartella `Documenti\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\`.

3. Il server Node.js (che hai avviato tramite il collegamento) è programmato per **rilevare e leggere automaticamente** questo file in background.

4. Apri l'applicazione web nel tuo browser (PC, tablet o smartphone): i dati (campi, silos, finanze) si aggiorneranno ogni pochi secondi **senza che tu debba fare nulla**!

### Metodo 2: Importazione manuale
Utilizza questo metodo se la sincronizzazione automatica non funziona o se stai giocando su un server dedicato/un altro PC.

1. Recupera il file `data.json` generato dalla mod. Si trova in:

`Documenti\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\data.json` (sul PC in cui è in esecuzione il gioco).


2. Apri l'applicazione web FS25 WebSync nel tuo browser.

3. Vai alla scheda **Mappa**.

4. Nell'angolo in alto a destra della mappa, fai clic sul pulsante **"Importa data.json manualmente"** (l'icona della cartella).

5. Seleziona il tuo file `data.json`.

6. I dati dell'applicazione si aggiorneranno immediatamente con il contenuto del file. Dovrai ripetere questa procedura per aggiornare i dati.

⚠️⚠️IMPORTANTE: Per utilizzare l'assistente AI nell'applicazione web, è necessario creare un file .env contenente la propria chiave API di Gemini (o un'altra chiave API).

Ecco la riga da copiare/incollare nel file .env: GEMINI_API_KEY=LA_TUA_CHIAVE_API
Sostituisci "LA_TUA_CHIAVE_API" con la tua chiave API.

Quindi, posiziona questo file in "C:\Users\AppData\Local\Guide_FS25"
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#Portugues(PT)
# Guia Completo: Instalar e Utilizar o FS25 WebSync

Este guia explica passo a passo como instalar a aplicação, iniciar o servidor e sincronizar os dados do seu jogo Farming Simulator 25.

---

## Passo 1: Instalar o Servidor e o Mod

1. **Extraia** o conteúdo do ficheiro `. zip` para a sua pasta `Downloads` (terá de obter uma pasta chamada `fs25-guide`).

2.º Aceda à pasta `fs25-guide/public` e **clique duas vezes no ficheiro `Install-FS25-WebSync-Local.bat`**.

3.º Uma janela preta será aberta. O script irá automaticamente:

- Copiar os ficheiros do servidor para a sua pasta local (`%LOCALAPPDATA%\Guide_FS25`).

- Criar um atalho **"FS25 WebSync (Local)"** no seu ambiente de trabalho.

- Descompacte e instale o ficheiro `FS25_WebSync_Mod. zip` directamente na pasta de mods do Farming Simulator 25 (`Documents\My Games\FarmingSimulator2025\mods`).

---

## Passo 2: Iniciar o Servidor

1.º Clique duas vezes no atalho **"FS25 WebSync (Local)"** na sua área de trabalho.

2.Na primeira execução, o script irá verificar se o **Node. js** está instalado. Caso contrário, irá solicitar que o descarregue em [nodejs.org](https://nodejs.org/).

3. O script irá instalar as dependências necessárias (isto pode demorar 1 a 2 minutos na primeira vez).

4. Após a inicialização, a consola exibirá os endereços para aceder à aplicação:

- **URL de acesso local**: `http://localhost:3000` (para abrir o guia no computador em que está a jogar).

- **URL de acesso à rede**: `http://192.168.X.X:3000` (para abrir o guia num tablet ou telemóvel ligado à mesma rede Wi-Fi).

5. ⚠️ **Deixe esta janela preta aberta** durante toda a sua sessão de jogo. Para a fechar, basta fechar a janela.

---

## Passo 3: Sincronização de Dados (O ficheiro `data. json`)

Existem **dois métodos** para a aplicação ler os seus dados de jogo (o ficheiro `data. json`):

### Método 1: Sincronização Automática (Recomendado)
Este é o método mais simples se estiver a jogar FS25 e a executar o servidor no **mesmo PC**.

1. Inicie o Farming Simulator 25 e **marque a opção "FS25 WebSync" ativada** antes de carregar o seu jogo guardado.

2.º Assim que entrar no jogo, o mod irá criar e atualizar automaticamente o ficheiro `data. json` na pasta `Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\`.

3. O servidor Node. js (que iniciou através do atalho) está programado para **detectar e ler automaticamente** este ficheiro em segundo plano.

4.º Abra a aplicação web no seu browser (PC, tablet ou smartphone): os dados (campos, silos, finanças) serão atualizados a cada poucos segundos **sem que tenha de fazer nada**!

### Método 2: Importação Manual
Utilize este método se a sincronização automática não funcionar ou se estiver a jogar num servidor dedicado/outro PC.

1.º Recupere o ficheiro `data. json` gerado pelo mod. O ficheiro está localizado em:

`Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\data.json` (no computador onde o jogo está a ser executado).

2.º Abra a aplicação web FS25 WebSync no seu browser.

3.º Aceda ao separador **Mapa**.

4.No canto superior direito do mapa, clique no botão **"Importar data. json manualmente"** (o ícone da pasta).

5.º Selecione o seu ficheiro `data. json`.

6. Os dados da aplicação serão atualizados instantaneamente com o conteúdo do ficheiro. Terá de repetir este processo para atualizar os dados.

⚠️⚠️IMPORTANTE: Para utilizar o assistente de IA na aplicação web, é necessário criar um ficheiro . env contendo a sua chave API Gemini (ou outra chave API).

Aqui está a linha para copiar e colar no ficheiro . env: GEMINI_API_KEY=SUA_CHAVE_DE_API
Substitua "SUA_CHAVE_DE_API" pela sua chave API.

De seguida, coloque este ficheiro em "C:\Users\AppData\Local\Guide_FS25"
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#Polski(PL)
# Kompletny przewodnik: Instalacja i korzystanie z FS25 WebSync

Ten przewodnik krok po kroku wyjaśnia, jak zainstalować aplikację, uruchomić serwer i zsynchronizować dane gry Farming Simulator 25.

---

## Krok 1: Instalacja serwera i moda

1. **Wypakuj** zawartość pliku `.zip` do folderu `Pobrane` (powinien pojawić się folder o nazwie `fs25-guide`).

2. Przejdź do folderu `fs25-guide/public` i **kliknij dwukrotnie plik `Install-FS25-WebSync-Local.bat`**.

3. Otworzy się czarne okno. Skrypt automatycznie:

- Skopiuje pliki serwera do folderu lokalnego (`%LOCALAPPDATA%\Guide_FS25`).

- Utwórz skrót **"FS25 WebSync (lokalny)"** na pulpicie.

- Spakuj i zainstaluj plik `FS25_WebSync_Mod.zip` bezpośrednio w folderze modów Farming Simulator 25 (`Dokumenty\Moje gry\FarmingSimulator2025\mods`).

---

## Krok 2: Uruchamianie serwera

1. Kliknij dwukrotnie skrót **FS25 WebSync (lokalny)"** na pulpicie.

2. Za pierwszym razem skrypt sprawdzi, czy **Node.js** jest zainstalowany. Jeśli nie, poprosi o pobranie go ze strony [nodejs.org](https://nodejs.org/).

3. Następnie skrypt zainstaluje niezbędne zależności (za pierwszym razem może to potrwać od 1 do 2 minut).

4. Po uruchomieniu konsola wyświetli adresy dostępu do aplikacji:

- **Adres URL dostępu lokalnego**: `http://localhost:3000` (aby otworzyć poradnik na komputerze, na którym grasz).

- **Adres URL dostępu sieciowego**: `http://192.168.X.X:3000` (aby otworzyć poradnik na tablecie lub telefonie podłączonym do tej samej sieci Wi-Fi).

5. ⚠️ **Pozostaw to czarne okno otwarte** na czas trwania sesji gry. Aby je zamknąć, po prostu je zamknij.

---

## Krok 3: Synchronizacja danych (plik `data.json`)

Istnieją **dwie metody** odczytu danych gry (pliku `data.json`) przez aplikację:

### Metoda 1: Synchronizacja automatyczna (zalecana)
To najprostsza metoda, jeśli grasz w FS25 i uruchamiasz serwer na **tym samym komputerze**.

1. Uruchom Farming Simulator 25 i **sprawdź mod „FS25 WebSync”** przed wczytaniem zapisu.

2. Gdy tylko wejdziesz do gry, mod automatycznie utworzy i zaktualizuje plik `data.json` w folderze `Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\`.

3. Serwer Node.js (uruchomiony za pomocą skrótu) jest zaprogramowany tak, aby **automatycznie wykrywał i odczytywał** ten plik w tle.

4. Otwórz aplikację internetową w przeglądarce (na komputerze, tablecie lub smartfonie): dane (pola, silosy, finanse) będą aktualizowane co kilka sekund **bez konieczności podejmowania jakichkolwiek działań**!

### Metoda 2: Import ręczny
Skorzystaj z tej metody, jeśli automatyczna synchronizacja nie działa lub jeśli grasz na dedykowanym serwerze/innym komputerze.

1. Pobierz plik `data.json` wygenerowany przez mod. Znajduje się on w:

`Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\data.json` (na komputerze, na którym działa gra).

2. Otwórz aplikację internetową FS25 WebSync w przeglądarce.

3. Przejdź do zakładki **Mapa**.

4. W prawym górnym rogu mapy kliknij przycisk **Importuj plik data.json ręcznie** (ikona folderu).

5. Wybierz plik `data.json`.

6. Dane aplikacji zostaną natychmiast zaktualizowane o zawartość pliku. Aby odświeżyć dane, należy powtórzyć ten proces.

⚠️⚠️WAŻNE: Aby korzystać z asystenta AI w aplikacji internetowej, musisz utworzyć plik .env zawierający klucz API Gemini (lub inny klucz API).

Oto wiersz do skopiowania/wklejenia do pliku .env: GEMINI_API_KEY=YOUR_API_KEY
Zastąp „YOUR_API_KEY” swoim kluczem API.

Następnie umieść ten plik w folderze „C:\Users\AppData\Local\Guide_FS25”
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#Romana(RO)
# Ghid complet: Instalarea și utilizarea FS25 WebSync

Acest ghid explică pas cu pas cum să instalați aplicația, să lansați serverul și să sincronizați datele jocului Farming Simulator 25.

---

## Pasul 1: Instalarea serverului și a modului

1. **Extrageți** conținutul fișierului `.zip` în folderul `Downloads` (ar trebui să obțineți un folder numit `fs25-guide`).

2. Accesați folderul `fs25-guide/public` și **faceți dublu clic pe fișierul `Install-FS25-WebSync-Local.bat`**.

3. Se va deschide o fereastră neagră. Scriptul va face automat:

- Copia fișierele serverului în folderul local (`%LOCALAPPDATA%\Guide_FS25`).

- Crea o comandă rapidă **„FS25 WebSync (Local)”** pe desktop.

- Arhivează și instalează fișierul `FS25_WebSync_Mod.zip` direct în folderul de mod-uri Farming Simulator 25 (`Documents\My Games\FarmingSimulator2025\mods`).

---

## Pasul 2: Pornirea serverului

1. Fă dublu clic pe comanda rapidă **„FS25 WebSync (Local)”** de pe desktop.

2. Prima dată, scriptul va verifica dacă **Node.js** este instalat. Dacă nu este, îți va cere să îl descarci de pe [nodejs.org](https://nodejs.org/).

3. Scriptul va instala apoi dependențele necesare (acest lucru poate dura 1 până la 2 minute prima dată).

4. După lansare, consola va afișa adresele pentru a accesa aplicația:

- **URL de acces local**: `http://localhost:3000` (pentru a deschide ghidul pe PC-ul pe care joci).

- **URL de acces la rețea**: `http://192.168.X.X:3000` (pentru a deschide ghidul pe o tabletă sau un telefon conectat la aceeași rețea Wi-Fi).

5. ⚠️ **Lăsați această fereastră neagră deschisă** pe durata sesiunii de joc. Pentru a o închide, pur și simplu închideți fereastra.

---

## Pasul 3: Sincronizarea datelor (Fișierul `data.json`)

Există **două metode** prin care aplicația poate citi datele jocului (fișierul `data.json`):

### Metoda 1: Sincronizare automată (Recomandată)
Aceasta este cea mai simplă metodă dacă jucați FS25 și rulați serverul pe **același PC**.

1. Lansați Farming Simulator 25 și **verificați modul „FS25 WebSync”** înainte de a încărca salvarea.

2. De îndată ce ești în joc, mod-ul va crea și actualiza automat fișierul `data.json` în folderul `Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\`.

3. Serverul Node.js (pe care l-ai lansat prin comanda rapidă) este programat să **detecteze și să citească automat** acest fișier în fundal.

4. Deschide aplicația web în browser-ul tău (PC, tabletă sau smartphone): datele (câmpuri, silozuri, finanțe) se vor actualiza la fiecare câteva secunde **fără a fi necesară nicio acțiune din partea ta**!

### Metoda 2: Import manual
Folosește această metodă dacă sincronizarea automată nu funcționează sau dacă joci pe un server dedicat/alt PC.

1. Preia fișierul `data.json` generat de mod. Se află în:

`Documents\My Games\FarmingSimulator2025\modSettings\FS25_WebSync\data.json` (pe PC-ul pe care rulează jocul).

2. Deschideți aplicația web FS25 WebSync în browser.

3. Accesați fila **Hartă**.

4. În colțul din dreapta sus al hărții, faceți clic pe butonul **„Import data.json manual”** (pictograma folderului).

5. Selectați fișierul `data.json`.

6. Datele aplicației se vor actualiza instantaneu cu conținutul fișierului. Va trebui să repetați acest proces pentru a reîmprospăta datele.

⚠️⚠️IMPORTANT: Pentru a utiliza asistentul AI în aplicația web, trebuie să creați un fișier .env care să conțină cheia API Gemini (sau altă cheie API).

Iată linia de copiat/lipit în fișierul .env: GEMINI_API_KEY=YOUR_API_KEY
Înlocuiți „YOUR_API_KEY” cu cheia API.

Apoi plasați acest fișier în „C:\Users\AppData\Local\Guide_FS25”
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
