!include LogicLib.nsh
!include nsDialogs.nsh

; Ensure PRODUCTNAME and MAINBINARYNAME are available when hooks are
; compiled.  The installer template includes this file before defining
; these constants, so we provide fallback values here.
!ifndef PRODUCTNAME
  !define PRODUCTNAME "WinLux"
!endif
!ifndef MAINBINARYNAME
  !define MAINBINARYNAME "WinLux"
!endif

Var WinLuxStartupCheckbox
Var WinLuxStartupCheckboxState

Function WinLuxInstallerPageShow
  StrCpy $WinLuxStartupCheckbox ""
  StrCpy $WinLuxStartupCheckboxState 0

  ${NSD_CreateCheckbox} 120u 145u 195u 10u "$(startupEnableOption)"
  Pop $WinLuxStartupCheckbox

  ${If} $WinLuxStartupCheckbox == error
    Return
  ${EndIf}

  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}"
  ${If} $0 != ""
    ${NSD_Check} $WinLuxStartupCheckbox
  ${EndIf}
FunctionEnd

Function WinLuxInstallerPageLeave
  ${If} $WinLuxStartupCheckbox == ""
    Return
  ${EndIf}

  ${NSD_GetState} $WinLuxStartupCheckbox $WinLuxStartupCheckboxState
  ${If} $WinLuxStartupCheckboxState = 1
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" --startup"
  ${Else}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}"
  ${EndIf}
FunctionEnd

!macro NSIS_HOOK_POSTINSTALL
  ; Startup state is handled on the finish page leave event.
!macroend

LangString startupEnableOption 1033 "Enable run at startup"
LangString startupEnableOption 2052 "允许开机自启"
LangString startupEnableOption 1028 "允許開機自啟"
LangString startupEnableOption 1041 "スタートアップで実行を有効にする"
LangString startupEnableOption 1042 "시작 시 자동 실행 허용"
LangString startupEnableOption 1054 "เปิดใช้งานเมื่อเริ่มระบบ"
LangString startupEnableOption 1066 "Bật chạy cùng Windows"
LangString startupEnableOption 1057 "Aktifkan jalankan saat startup"
LangString startupEnableOption 1036 "Activer l'exécution au démarrage"
LangString startupEnableOption 1031 "Beim Start ausführen aktivieren"
LangString startupEnableOption 1040 "Abilita esecuzione all'avvio"
LangString startupEnableOption 1034 "Habilitar ejecución al iniciar"
LangString startupEnableOption 3082 "Habilitar ejecución al iniciar"
LangString startupEnableOption 2070 "Ativar execução no arranque"
LangString startupEnableOption 1046 "Ativar execução na inicialização"
LangString startupEnableOption 1049 "Включить автозапуск"
LangString startupEnableOption 1045 "Włącz uruchamianie przy starcie"
LangString startupEnableOption 1055 "Başlangıçta çalıştırmayı etkinleştir"
LangString startupEnableOption 1058 "Увімкнути запуск під час старту"
LangString startupEnableOption 1029 "Povolit spuštění při startu"
LangString startupEnableOption 1038 "Futtatás engedélyezése indításkor"
LangString startupEnableOption 1032 "Ενεργοποίηση εκτέλεσης κατά την εκκίνηση"
LangString startupEnableOption 1026 "Активирай стартиране при включване"
LangString startupEnableOption 1048 "Activează rularea la pornire"
LangString startupEnableOption 1025 "تمكين التشغيل عند بدء التشغيل"
LangString startupEnableOption 1043 "Automatisch starten inschakelen"
LangString startupEnableOption 1030 "Aktivér kørsel ved opstart"
LangString startupEnableOption 1035 "Ota käynnistys ajon yhteydessä käyttöön"
LangString startupEnableOption 1044 "Aktiver kjøring ved oppstart"
LangString startupEnableOption 1053 "Aktivera körning vid uppstart"
