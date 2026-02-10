!include LogicLib.nsh
!include nsDialogs.nsh

Var WinLuxStartupCheckbox
Var WinLuxStartupCheckboxState

!macro NSIS_HOOK_PREINSTALL
  StrCpy $WinLuxStartupCheckboxState 0

  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Return
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 20u "$(startupQuestion)"
  Pop $1

  ${NSD_CreateCheckbox} 0 24u 100% 12u "$(startupEnableOption)"
  Pop $WinLuxStartupCheckbox

  StrCpy $WinLuxStartupCheckboxState 0

  nsDialogs::Show

  ${NSD_GetState} $WinLuxStartupCheckbox $WinLuxStartupCheckboxState
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ${If} $WinLuxStartupCheckboxState = 1
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" --startup"
  ${Else}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}"
  ${EndIf}
!macroend

LangString startupQuestion ${LANG_ENGLISH} "Startup Option"
LangString startupEnableOption ${LANG_ENGLISH} "Enable Run at Startup"

LangString startupQuestion ${LANG_SIMPCHINESE} "启动选项"
LangString startupEnableOption ${LANG_SIMPCHINESE} "允许开机自启"

LangString startupQuestion ${LANG_TRADCHINESE} "啟動選項"
LangString startupEnableOption ${LANG_TRADCHINESE} "允許開機自啟"

LangString startupQuestion ${LANG_JAPANESE} "起動オプション"
LangString startupEnableOption ${LANG_JAPANESE} "スタートアップで実行を有効にする"

LangString startupQuestion ${LANG_KOREAN} "시작 옵션"
LangString startupEnableOption ${LANG_KOREAN} "시작 시 자동 실행 허용"
