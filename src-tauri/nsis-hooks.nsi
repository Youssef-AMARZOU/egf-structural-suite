; Tauri v2 NSIS installer hooks — EGF Structural Suite
; Creates a persistent desktop shortcut (per-user install => user Desktop).

!macro NSIS_HOOK_POSTINSTALL
  CreateShortcut "$DESKTOP\EGF Structural Suite.lnk" "$INSTDIR\egf-structural-suite.exe" "" "$INSTDIR\egf-structural-suite.exe" 0
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$DESKTOP\EGF Structural Suite.lnk"
!macroend
