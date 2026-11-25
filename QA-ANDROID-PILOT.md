# Android UI pilot

First run 45661381614: APK compiled and installed; real login screen appeared behind system dialog Pixel Launcher isn't responding. UI assertion failed. No evidence of app crash. Subsequent checks not performed. SafeAreaView deprecation noted.

Second attempt: AOSP emulator image, boot stabilization and longer login wait. No productive app or database changes; offline dummy configuration remains.

Second run 45679615123: installed APK and rendered login again. Screenshot shows Quickstep launcher ANR, not Familienfunke. Third attempt explicitly records and dismisses only this named OS dialog, then requires the original app assertions; app-specific ANRs are not suppressed. No production changes.
